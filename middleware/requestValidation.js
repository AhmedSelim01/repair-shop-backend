
const Joi = require('joi');
const logger = require('../config/logger');

// Common validation schemas
const schemas = {
  user: {
    register: Joi.object({
      name: Joi.string().min(2).max(50).when('role', {
        is: Joi.valid('general', 'employee', 'truck_owner'),
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
      email: Joi.string().email().required(),
      phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).when('role', {
        is: 'admin',
        then: Joi.optional(),
        otherwise: Joi.required()
      }),
      password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        }),
      role: Joi.string().valid('general', 'truck_owner', 'company', 'admin', 'employee').default('general'),
      licensePlate: Joi.string().pattern(/^[A-Z0-9-]{2,11}$/).when('role', {
        is: 'truck_owner',
        then: Joi.required(),
        otherwise: Joi.optional()
      })
    }),
    update: Joi.object({
      name: Joi.string().min(2).max(50),
      email: Joi.string().email(),
      phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/),
      isActive: Joi.boolean()
    }).min(1)
  },
  
  jobCard: {
    create: Joi.object({
      truckId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
      driverId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
      serviceType: Joi.string().valid('maintenance', 'repair', 'inspection').required(),
      description: Joi.string().min(10).max(1000).required(),
      estimatedCost: Joi.number().positive().required(),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium')
    })
  }
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      logger.warn('Validation failed', { 
        endpoint: req.path, 
        method: req.method, 
        errors,
        userId: req.user?.id 
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    next();
  };
};

module.exports = { validate, schemas };
