const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Travel App API',
            version: '1.0.0',
            description: 'API Documentation for Travel Web App Backend',
            contact: {
                name: 'API Support',
                email: 'support@travelapp.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000/api',
                description: 'Local server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
