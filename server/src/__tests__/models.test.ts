import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import Lead from '../models/Lead.js';
import Client from '../models/Client.js';

const objectId = () => new mongoose.Types.ObjectId();

describe('model defaults', () => {
  it('generates a lead number before validation', async () => {
    const lead = new Lead({
      companyName: 'Test Manufacturing Co',
      contactPerson: 'Asha Verma',
      email: 'asha@example.com',
      phone: '9876543210',
      source: 'website',
      assignedTo: objectId(),
    });

    await expect(lead.validate()).resolves.toBeUndefined();
    expect(lead.leadNumber).toMatch(/^LEAD-/);
  });

  it('generates a client number before validation', async () => {
    const client = new Client({
      leadId: objectId(),
      companyName: 'Test Manufacturing Co',
      contactPerson: 'Asha Verma',
      email: 'asha@example.com',
      phone: '9876543210',
      accountManager: objectId(),
    });

    await expect(client.validate()).resolves.toBeUndefined();
    expect(client.clientNumber).toMatch(/^CLT-/);
  });
});
