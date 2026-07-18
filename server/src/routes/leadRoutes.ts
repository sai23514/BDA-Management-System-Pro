import { Router } from 'express';
import {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  updateLeadStatus,
  assignLead,
  getLeadStats,
  bulkLeadAction,
  importLeads,
} from '../controllers/leadController.js';
import { getLeadActivities, createActivity } from '../controllers/activityController.js';
import { sendLeadEmail, sendLeadMessage } from '../controllers/communicationController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize, canAccessLead, canModify } from '../middlewares/rbacMiddleware.js';
import {
  createLeadValidation,
  updateLeadValidation,
  updateLeadStatusValidation,
  assignLeadValidation,
  paginationValidation,
  idValidation,
  createActivityValidation,
  validate,
} from '../middlewares/validationMiddleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

// All routes are protected
router.use(protect);

// Lead statistics
router.get('/stats', getLeadStats);

// Bulk operations and import (managers / team leads)
router.post(
  '/bulk',
  authorize(ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD),
  bulkLeadAction,
);
router.post('/import', canModify, importLeads);

// Lead CRUD operations
router.get('/', paginationValidation, validate, getLeads);
router.post('/', canModify, createLeadValidation, validate, createLead);

router.get('/:id', idValidation, validate, canAccessLead, getLead);
router.put('/:id', idValidation, updateLeadValidation, validate, canAccessLead, canModify, updateLead);
router.delete(
  '/:id',
  idValidation,
  validate,
  canAccessLead,
  authorize(ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD),
  deleteLead,
);

// Lead specific actions
router.patch(
  '/:id/status',
  idValidation,
  updateLeadStatusValidation,
  validate,
  canAccessLead,
  canModify,
  updateLeadStatus,
);
router.patch(
  '/:id/assign',
  idValidation,
  assignLeadValidation,
  validate,
  authorize(ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD),
  assignLead,
);

// Lead communications
router.post('/:id/email', idValidation, validate, canAccessLead, sendLeadEmail);
router.post('/:id/message', idValidation, validate, canAccessLead, sendLeadMessage);

// Lead activities
router.get(
  '/:id/activities',
  idValidation,
  paginationValidation,
  validate,
  canAccessLead,
  getLeadActivities,
);
router.post(
  '/:id/activities',
  idValidation,
  createActivityValidation,
  validate,
  canAccessLead,
  canModify,
  createActivity,
);

export default router;
