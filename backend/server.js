// Make sure the server imports and uses the user routes
const userRoutes = require('./routes/user');
app.use('/api/users', userRoutes); 