import { Link } from 'react-router-dom';
import { FaUsers, FaLock, FaTag, FaComments } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

const BowlList = ({ bowls }) => {
  if (!bowls || bowls.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">No bowls found</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Be the first to create a bowl!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bowls.map(bowl => (
        <BowlCard key={bowl._id} bowl={bowl} />
      ))}
    </div>
  );
};

const BowlCard = ({ bowl }) => {
  const {
    _id,
    title,
    description,
    tags,
    isPublic,
    createdBy,
    createdAt
  } = bowl;

  // Truncate long descriptions
  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  return (
    <Link 
      to={`/community/bowl/${_id}`}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full"
    >
      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-1 flex items-center">
            {!isPublic && <FaLock className="text-gray-500 dark:text-gray-400 mr-2" size={16} />}
            {title}
          </h2>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">{truncateText(description)}</p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {tags && tags.map((tag, index) => (
            <span 
              key={index} 
              className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs px-2 py-1 rounded-full flex items-center"
            >
              <FaTag className="mr-1" size={10} /> {tag}
            </span>
          ))}
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3 mt-auto border-t border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center">
            {createdBy?.avatar ? (
              <img 
                src={createdBy.avatar} 
                alt={createdBy.name || 'User'}
                className="w-6 h-6 rounded-full mr-2"
              />
            ) : (
              <div className="w-6 h-6 bg-blue-500 dark:bg-blue-600 rounded-full mr-2 flex items-center justify-center text-white text-xs">
                {(createdBy?.name || 'U').charAt(0)}
              </div>
            )}
            <span>
              {createdBy?.name || 'Anonymous'}
            </span>
          </div>
          <div>
            {createdAt && formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BowlList; 