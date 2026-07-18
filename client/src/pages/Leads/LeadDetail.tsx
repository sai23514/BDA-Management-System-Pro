import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Divider,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from '@mui/material';
import {
  ArrowBack,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  AutoAwesome,
  PersonAdd,
  Add,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchLead } from '../../redux/slices/leadSlice';
import { convertLeadToClient } from '../../redux/slices/clientSlice';
import api, { getApiErrorMessage } from '../../services/api';
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, DATE_TIME_FORMAT } from '../../constants';
import type { ActivityType } from '../../types';

interface FieldProps {
  label: string;
  value?: string | number | null;
  capitalize?: boolean;
}

const Field = ({ label, value, capitalize }: FieldProps) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1" sx={{ textTransform: capitalize ? 'capitalize' : 'none' }}>
      {value ?? '—'}
    </Typography>
  </Box>
);

const ACTIVITY_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'call', label: 'Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'note', label: 'Note' },
  { value: 'task', label: 'Task' },
];

const LeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { currentLead, loading } = useAppSelector((state) => state.leads);

  // Activity composer
  const [activityType, setActivityType] = useState<ActivityType>('note');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [savingActivity, setSavingActivity] = useState(false);

  // Email dialog
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);

  // Message dialog
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgChannel, setMsgChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [msgBody, setMsgBody] = useState('');
  const [msgBusy, setMsgBusy] = useState(false);

  // AI summary dialog
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryBusy, setSummaryBusy] = useState(false);

  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchLead(id));
  }, [dispatch, id]);

  const refresh = () => {
    if (id) dispatch(fetchLead(id));
  };

  const handleLogActivity = async () => {
    if (!id || !subject.trim()) {
      enqueueSnackbar('Subject is required', { variant: 'warning' });
      return;
    }
    setSavingActivity(true);
    try {
      await api.post(`/leads/${id}/activities`, {
        type: activityType,
        subject,
        description: description || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        status: dueDate ? 'pending' : 'completed',
      });
      enqueueSnackbar('Activity logged', { variant: 'success' });
      setSubject('');
      setDescription('');
      setDueDate('');
      refresh();
    } catch (error) {
      enqueueSnackbar(getApiErrorMessage(error, 'Failed to log activity'), { variant: 'error' });
    } finally {
      setSavingActivity(false);
    }
  };

  const handleAiDraft = async () => {
    if (!id) return;
    setEmailBusy(true);
    try {
      const res = await api.post<{ data: { draft: { subject: string; body: string } } }>(
        '/ai/draft-email',
        { leadId: id, purpose: 'follow up on the opportunity' },
      );
      setEmailSubject(res.data.data.draft.subject);
      setEmailBody(res.data.data.draft.body);
      enqueueSnackbar('Draft generated', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(getApiErrorMessage(error, 'AI draft unavailable'), { variant: 'warning' });
    } finally {
      setEmailBusy(false);
    }
  };

  const handleSendEmail = async () => {
    if (!id) return;
    setEmailBusy(true);
    try {
      await api.post(`/leads/${id}/email`, { subject: emailSubject, body: emailBody });
      enqueueSnackbar('Email sent', { variant: 'success' });
      setEmailOpen(false);
      setEmailSubject('');
      setEmailBody('');
      refresh();
    } catch (error) {
      enqueueSnackbar(getApiErrorMessage(error, 'Failed to send email'), { variant: 'error' });
    } finally {
      setEmailBusy(false);
    }
  };

  const handleSendMessage = async () => {
    if (!id) return;
    setMsgBusy(true);
    try {
      await api.post(`/leads/${id}/message`, { channel: msgChannel, body: msgBody });
      enqueueSnackbar('Message sent', { variant: 'success' });
      setMsgOpen(false);
      setMsgBody('');
      refresh();
    } catch (error) {
      enqueueSnackbar(getApiErrorMessage(error, 'Failed to send message'), { variant: 'error' });
    } finally {
      setMsgBusy(false);
    }
  };

  const handleSummarize = async () => {
    if (!id) return;
    setSummaryOpen(true);
    setSummaryBusy(true);
    setSummary('');
    try {
      const res = await api.post<{ data: { summary: string } }>('/ai/summarize', { leadId: id });
      setSummary(res.data.data.summary);
    } catch (error) {
      setSummary(getApiErrorMessage(error, 'AI summary unavailable'));
    } finally {
      setSummaryBusy(false);
    }
  };

  const handleConvert = async () => {
    if (!id) return;
    setConverting(true);
    try {
      const client = await dispatch(convertLeadToClient(id)).unwrap();
      enqueueSnackbar('Lead converted to client', { variant: 'success' });
      navigate(`/clients/${client._id}`);
    } catch (error) {
      enqueueSnackbar(typeof error === 'string' ? error : 'Failed to convert lead', {
        variant: 'error',
      });
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentLead?.lead) {
    return (
      <Box>
        <Typography>Lead not found</Typography>
      </Box>
    );
  }

  const { lead } = currentLead;
  const activities = currentLead.activities ?? [];

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/leads')} sx={{ mb: 2 }}>
        Back to Leads
      </Button>

      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {lead.companyName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {lead.leadNumber}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={LEAD_STATUS_LABELS[lead.status]}
              sx={{ bgcolor: LEAD_STATUS_COLORS[lead.status], color: 'white' }}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<EmailIcon />}
              onClick={() => setEmailOpen(true)}
            >
              Email
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<WhatsAppIcon />}
              onClick={() => setMsgOpen(true)}
            >
              Message
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AutoAwesome />}
              onClick={handleSummarize}
            >
              AI Summary
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={handleConvert}
              disabled={converting}
            >
              Convert to Client
            </Button>
          </Stack>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
          }}
        >
          <Box>
            <Field label="Contact Person" value={lead.contactPerson} />
            <Field label="Email" value={lead.email} />
            <Field label="Phone" value={lead.phone} />
            <Field label="Source" value={lead.source} capitalize />
          </Box>
          <Box>
            <Field label="Estimated Value" value={`₹${lead.estimatedValue?.toLocaleString()}`} />
            <Field label="Priority" value={lead.priority} capitalize />
            <Field label="Score" value={`${lead.score}/100`} />
            <Field
              label="Created Date"
              value={format(new Date(lead.createdAt), DATE_TIME_FORMAT)}
            />
          </Box>
        </Box>

        {lead.requirements && <Field label="Requirements" value={lead.requirements} />}
        {lead.notes && <Field label="Notes" value={lead.notes} />}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Log Activity
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '160px 1fr' },
            gap: 2,
            mb: 2,
          }}
        >
          <TextField
            select
            label="Type"
            value={activityType}
            onChange={(e) => setActivityType(e.target.value as ActivityType)}
          >
            {ACTIVITY_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </Box>
        <TextField
          label="Details"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Due date (optional)"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleLogActivity}
            disabled={savingActivity}
          >
            Add Activity
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Activities ({activities.length})
        </Typography>

        {activities.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No activities yet
          </Typography>
        ) : (
          <Box sx={{ mt: 2 }}>
            {activities.map((activity) => (
              <Paper key={activity._id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {activity.subject}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activity.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(activity.createdAt), DATE_TIME_FORMAT)} •{' '}
                  <span style={{ textTransform: 'capitalize' }}>{activity.type}</span>
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Paper>

      {/* Email dialog */}
      <Dialog open={emailOpen} onClose={() => setEmailOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Send Email to {lead.contactPerson}</DialogTitle>
        <DialogContent>
          <Button
            size="small"
            startIcon={<AutoAwesome />}
            onClick={handleAiDraft}
            disabled={emailBusy}
            sx={{ mt: 1, mb: 2 }}
          >
            Draft with AI
          </Button>
          <TextField
            label="Subject"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Body"
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            fullWidth
            multiline
            minRows={6}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSendEmail} disabled={emailBusy}>
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message dialog */}
      <Dialog open={msgOpen} onClose={() => setMsgOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Send Message to {lead.contactPerson}</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Channel"
            value={msgChannel}
            onChange={(e) => setMsgChannel(e.target.value as 'whatsapp' | 'sms')}
            sx={{ mt: 1, mb: 2, minWidth: 180 }}
          >
            <MenuItem value="whatsapp">WhatsApp</MenuItem>
            <MenuItem value="sms">SMS</MenuItem>
          </TextField>
          <TextField
            label="Message"
            value={msgBody}
            onChange={(e) => setMsgBody(e.target.value)}
            fullWidth
            multiline
            minRows={4}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMsgOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSendMessage} disabled={msgBusy}>
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI summary dialog */}
      <Dialog open={summaryOpen} onClose={() => setSummaryOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>AI Summary</DialogTitle>
        <DialogContent>
          {summaryBusy ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {summary}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSummaryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeadDetail;
