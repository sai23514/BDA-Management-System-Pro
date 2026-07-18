import mongoose, { type Types } from 'mongoose';
import User, { type UserDocument, type IUserTargets } from '../models/User.js';
import Lead from '../models/Lead.js';
import Activity from '../models/Activity.js';
import Team from '../models/Team.js';
import { generateLeadNumber } from '../utils/helpers.js';
import { env } from '../config/env.js';
import {
  ROLES,
  LEAD_SOURCES,
  LEAD_STATUS,
  LEAD_PRIORITY,
  ACTIVITY_TYPES,
  ACTIVITY_STATUS,
  type Role,
  type LeadSource,
  type LeadStatus,
  type LeadPriority,
  type ActivityType,
  type ActivityStatus,
} from '../utils/constants.js';

interface SeedUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  phone: string;
  department: string;
  targets?: IUserTargets;
  isActive: boolean;
}

interface SeedLead {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry: string;
  location: { city: string; state: string; country: string };
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  estimatedValue: number;
  expectedCloseDate?: Date;
  wonDate?: Date;
  lostReason?: string;
  requirements: string;
  notes: string;
}

interface SeedActivity {
  type: ActivityType;
  subject: string;
  description: string;
  leadId: Types.ObjectId;
  userId: Types.ObjectId;
  status: ActivityStatus;
  priority: LeadPriority;
  completedDate: Date;
  duration?: number;
}

const sampleUsers: SeedUser[] = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@bda.com',
    password: 'admin123',
    role: ROLES.SUPER_ADMIN,
    phone: '9876543210',
    department: 'Management',
    isActive: true,
  },
  {
    firstName: 'John',
    lastName: 'Manager',
    email: 'manager@bda.com',
    password: 'manager123',
    role: ROLES.MANAGER,
    phone: '9876543211',
    department: 'Sales',
    isActive: true,
  },
  {
    firstName: 'Sarah',
    lastName: 'Lead',
    email: 'teamlead@bda.com',
    password: 'lead123',
    role: ROLES.TEAM_LEAD,
    phone: '9876543212',
    department: 'Sales',
    isActive: true,
  },
  {
    firstName: 'Mike',
    lastName: 'Smith',
    email: 'mike@bda.com',
    password: 'mike123',
    role: ROLES.BDA,
    phone: '9876543213',
    department: 'Sales',
    targets: { monthly: 500000, quarterly: 1500000, yearly: 6000000 },
    isActive: true,
  },
  {
    firstName: 'Emily',
    lastName: 'Johnson',
    email: 'emily@bda.com',
    password: 'emily123',
    role: ROLES.BDA,
    phone: '9876543214',
    department: 'Sales',
    targets: { monthly: 500000, quarterly: 1500000, yearly: 6000000 },
    isActive: true,
  },
];

const sampleLeads: SeedLead[] = [
  {
    companyName: 'Tech Innovations Pvt Ltd',
    contactPerson: 'Rajesh Kumar',
    email: 'rajesh@techinnovations.com',
    phone: '9988776655',
    industry: 'Information Technology',
    location: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    source: LEAD_SOURCES.LINKEDIN,
    status: LEAD_STATUS.QUALIFIED,
    priority: LEAD_PRIORITY.HIGH,
    estimatedValue: 2500000,
    expectedCloseDate: new Date('2026-06-15'),
    requirements: 'Looking for complete CRM solution with mobile app integration',
    notes: 'Very interested, follow up next week',
  },
  {
    companyName: 'Manufacturing Solutions Inc',
    contactPerson: 'Priya Sharma',
    email: 'priya@mansol.com',
    phone: '9988776656',
    industry: 'Manufacturing',
    location: { city: 'Pune', state: 'Maharashtra', country: 'India' },
    source: LEAD_SOURCES.REFERRAL,
    status: LEAD_STATUS.PROPOSAL,
    priority: LEAD_PRIORITY.HIGH,
    estimatedValue: 3500000,
    expectedCloseDate: new Date('2026-06-30'),
    requirements: 'ERP integration with existing manufacturing systems',
    notes: 'Proposal sent on May 20th, awaiting response',
  },
  {
    companyName: 'Global Trading Co',
    contactPerson: 'Amit Patel',
    email: 'amit@globaltrading.com',
    phone: '9988776657',
    industry: 'Trading',
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    source: LEAD_SOURCES.WEBSITE,
    status: LEAD_STATUS.NEGOTIATION,
    priority: LEAD_PRIORITY.MEDIUM,
    estimatedValue: 1800000,
    expectedCloseDate: new Date('2026-07-15'),
    requirements: 'Lead management and reporting tools',
    notes: 'In final negotiation stage, price discussion pending',
  },
  {
    companyName: 'HealthCare Plus',
    contactPerson: 'Dr. Sunita Verma',
    email: 'sunita@healthcareplus.com',
    phone: '9988776658',
    industry: 'Healthcare',
    location: { city: 'Delhi', state: 'Delhi', country: 'India' },
    source: LEAD_SOURCES.COLD_CALL,
    status: LEAD_STATUS.CONTACTED,
    priority: LEAD_PRIORITY.MEDIUM,
    estimatedValue: 1200000,
    expectedCloseDate: new Date('2026-08-01'),
    requirements: 'Patient management and appointment scheduling',
    notes: 'Initial call completed, sending brochure',
  },
  {
    companyName: 'AutoParts Express',
    contactPerson: 'Vikram Singh',
    email: 'vikram@autoparts.com',
    phone: '9988776659',
    industry: 'Automotive',
    location: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    source: LEAD_SOURCES.TRADE_SHOW,
    status: LEAD_STATUS.NEW,
    priority: LEAD_PRIORITY.LOW,
    estimatedValue: 800000,
    expectedCloseDate: new Date('2026-09-01'),
    requirements: 'Inventory management system',
    notes: 'Met at auto expo, interested in demo',
  },
  {
    companyName: 'Textile Masters Ltd',
    contactPerson: 'Lakshmi Iyer',
    email: 'lakshmi@textilemasters.com',
    phone: '9988776660',
    industry: 'Textile',
    location: { city: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
    source: LEAD_SOURCES.EMAIL_CAMPAIGN,
    status: LEAD_STATUS.WON,
    priority: LEAD_PRIORITY.HIGH,
    estimatedValue: 4500000,
    wonDate: new Date('2026-05-15'),
    requirements: 'Complete business management suite',
    notes: 'Deal closed! Implementation starting next month',
  },
  {
    companyName: 'FoodChain Logistics',
    contactPerson: 'Arjun Reddy',
    email: 'arjun@foodchain.com',
    phone: '9988776661',
    industry: 'Logistics',
    location: { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    source: LEAD_SOURCES.REFERRAL,
    status: LEAD_STATUS.LOST,
    priority: LEAD_PRIORITY.MEDIUM,
    estimatedValue: 1500000,
    lostReason: 'Budget constraints, went with competitor',
    requirements: 'Fleet and delivery management',
    notes: 'Lost to cheaper alternative',
  },
  {
    companyName: 'Edu-Tech Solutions',
    contactPerson: 'Neha Gupta',
    email: 'neha@edutech.com',
    phone: '9988776662',
    industry: 'Education',
    location: { city: 'Jaipur', state: 'Rajasthan', country: 'India' },
    source: LEAD_SOURCES.WEBSITE,
    status: LEAD_STATUS.NURTURING,
    priority: LEAD_PRIORITY.LOW,
    estimatedValue: 900000,
    expectedCloseDate: new Date('2026-10-01'),
    requirements: 'Student and course management platform',
    notes: 'Not ready to buy now, follow up in 2 months',
  },
];

const seedDatabase = async (): Promise<void> => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Lead.deleteMany({});
    await Activity.deleteMany({});
    await Team.deleteMany({});
    console.log('Existing data cleared');

    console.log('Creating users...');
    const createdUsers: UserDocument[] = [];

    for (const userData of sampleUsers) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`   Created: ${user.email}`);
    }

    console.log(`Created ${createdUsers.length} users`);

    const bdaUsers = createdUsers.filter((u) => u.role === ROLES.BDA);

    console.log('Creating leads...');
    const createdLeads = [];

    for (let i = 0; i < sampleLeads.length; i++) {
      const lead = await Lead.create({
        ...sampleLeads[i],
        leadNumber: generateLeadNumber(),
        assignedTo: bdaUsers[i % bdaUsers.length]._id,
        assignedBy: createdUsers[0]._id,
      });
      createdLeads.push(lead);
    }

    console.log(`Created ${createdLeads.length} leads`);

    console.log('Creating activities...');
    const activities: SeedActivity[] = [];

    createdLeads.forEach((lead, index) => {
      activities.push({
        type: ACTIVITY_TYPES.CALL,
        subject: 'Initial Contact Call',
        description: `First call with ${lead.contactPerson} from ${lead.companyName}`,
        leadId: lead._id,
        userId: lead.assignedTo,
        status: ACTIVITY_STATUS.COMPLETED,
        priority: LEAD_PRIORITY.MEDIUM,
        completedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        duration: 15,
      });

      if (index % 2 === 0) {
        activities.push({
          type: ACTIVITY_TYPES.EMAIL,
          subject: 'Proposal Sent',
          description: `Sent detailed proposal to ${lead.contactPerson}`,
          leadId: lead._id,
          userId: lead.assignedTo,
          status: ACTIVITY_STATUS.COMPLETED,
          priority: LEAD_PRIORITY.HIGH,
          completedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        });
      }
    });

    await Activity.insertMany(activities);
    console.log(`Created ${activities.length} activities`);

    console.log('\nDatabase seeded successfully!\n');
    console.log('Sample Login Credentials:');
    console.log('Admin:     admin@bda.com / admin123');
    console.log('Manager:   manager@bda.com / manager123');
    console.log('Team Lead: teamlead@bda.com / lead123');
    console.log('BDA 1:     mike@bda.com / mike123');
    console.log('BDA 2:     emily@bda.com / emily123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

void seedDatabase();
