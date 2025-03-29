from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
import pandas as pd
import os


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))

db = client["jobsDB"]
users_collection = db["users"]
jobs_collection = db["jobs"]

tfidf_vectorizer = TfidfVectorizer(stop_words='english')

def preprocess_text(text):
    """Preprocess text by converting to lowercase and removing special characters"""
    if not isinstance(text, str):
        return ""
    return text.lower()

def get_user_skills_vector(user_id):
    """Get user skills and create a vector representation"""
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user or 'skills' not in user:
            return None
        return ' '.join(user['skills'])
    except Exception as e:
        print(f"Error getting user skills: {str(e)}")
        return None

def get_job_vectors():
    """Get all job descriptions and create TF-IDF vectors"""
    try:
        jobs = list(jobs_collection.find())
        if not jobs:
            return [], None
            
        job_descriptions = []
        valid_jobs = []
        
        for job in jobs:
            description_parts = []
            
            if 'title' in job:
                description_parts.append(str(job['title']))
            
            if 'description' in job:
                description_parts.append(str(job['description']))
            
            if 'skills' in job:
                description_parts.extend(job['skills'])
            
            if 'companyDetails' in job and 'about' in job['companyDetails']:
                description_parts.append(str(job['companyDetails']['about']))
            
            if description_parts:
                job_descriptions.append(' '.join(description_parts))
                valid_jobs.append(job)
        
        if not job_descriptions:
            return [], None
            
        job_vectors = tfidf_vectorizer.fit_transform(job_descriptions)
        return valid_jobs, job_vectors
    except Exception as e:
        print(f"Error getting job vectors: {str(e)}")
        return [], None

def calculate_similarity(user_skills, job_vectors):
    """Calculate cosine similarity between user skills and job vectors"""
    try:
        if not user_skills or job_vectors is None:
            return np.array([])
        user_vector = tfidf_vectorizer.transform([user_skills])
        similarities = cosine_similarity(user_vector, job_vectors).flatten()
        return similarities
    except Exception as e:
        print(f"Error calculating similarity: {str(e)}")
        return np.array([])

def get_collaborative_recommendations(user_id, n_recommendations=5):
    """Get collaborative recommendations based on similar users"""
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user or 'AppliedJobs' not in user:
            return []
        
        user_applied_jobs = set(str(job_id) for job_id in user['AppliedJobs'])
        
        similar_users = []
        for other_user in users_collection.find({'_id': {'$ne': ObjectId(user_id)}}):
            if 'AppliedJobs' in other_user:
                other_applied_jobs = set(str(job_id) for job_id in other_user['AppliedJobs'])
                if user_applied_jobs or other_applied_jobs:  
                    similarity = len(user_applied_jobs.intersection(other_applied_jobs)) / \
                                len(user_applied_jobs.union(other_applied_jobs))
                    similar_users.append((other_user['_id'], similarity))
        
        similar_users.sort(key=lambda x: x[1], reverse=True)
        
        recommended_jobs = set()
        for similar_user_id, _ in similar_users[:5]:  
            similar_user = users_collection.find_one({'_id': similar_user_id})
            if similar_user and 'AppliedJobs' in similar_user:
                recommended_jobs.update(str(job_id) for job_id in similar_user['AppliedJobs'])
        
        recommended_jobs = recommended_jobs - user_applied_jobs
        
        return list(recommended_jobs)[:n_recommendations]
    except Exception as e:
        print(f"Error getting collaborative recommendations: {str(e)}")
        return []

@app.route('/api/recommendations/<user_id>', methods=['GET'])
def get_recommendations(user_id):
    try:

        user_skills = get_user_skills_vector(user_id)
        if not user_skills:
            return jsonify({'error': 'User skills not found'}), 404
        
        jobs, job_vectors = get_job_vectors()
        if not jobs or job_vectors is None:
            return jsonify({'error': 'No jobs found in the database'}), 404
        
        similarities = calculate_similarity(user_skills, job_vectors)
        if len(similarities) == 0:
            return jsonify({'error': 'Could not calculate job similarities'}), 500
        
        collaborative_jobs = get_collaborative_recommendations(user_id)
        
        job_scores = []
        for i, job in enumerate(jobs):
            content_score = float(similarities[i])
            collaborative_score = 1.0 if str(job['_id']) in collaborative_jobs else 0.0
            combined_score = 0.7 * content_score + 0.3 * collaborative_score
            
            job_scores.append({
                'job_id': str(job['_id']),
                'title': job.get('title', 'Unknown Title'),
                'company': job.get('company', 'Unknown Company'),
                'score': combined_score
            })
        
        job_scores.sort(key=lambda x: x['score'], reverse=True)
        recommendations = job_scores[:]
        
        return jsonify({
            'recommendations': recommendations
        })
    
    except Exception as e:
        print(f"Error in get_recommendations: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
