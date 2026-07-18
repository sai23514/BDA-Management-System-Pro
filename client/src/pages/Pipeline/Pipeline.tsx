import { useEffect, useState, type DragEvent } from 'react';
import { Box, Typography, Paper, Chip, CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchLeads, updateLeadStatus } from '../../redux/slices/leadSlice';
import { LEAD_STATUS, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '../../constants';
import type { LeadPriority, LeadStatus } from '../../types';

const pipelineStages: LeadStatus[] = [
  LEAD_STATUS.NEW,
  LEAD_STATUS.CONTACTED,
  LEAD_STATUS.QUALIFIED,
  LEAD_STATUS.PROPOSAL,
  LEAD_STATUS.NEGOTIATION,
  LEAD_STATUS.WON,
];

const priorityColor = (priority: LeadPriority): 'error' | 'warning' | 'success' => {
  if (priority === 'high') return 'error';
  if (priority === 'medium') return 'warning';
  return 'success';
};

const Pipeline = () => {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { leads, loading } = useAppSelector((state) => state.leads);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchLeads());
  }, [dispatch]);

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    const lead = leads.find((item) => item._id === leadId);
    if (!lead || lead.status === newStatus) {
      return;
    }

    try {
      await dispatch(updateLeadStatus({ id: leadId, status: newStatus })).unwrap();
      enqueueSnackbar('Lead status updated', { variant: 'success' });
      dispatch(fetchLeads());
    } catch (error) {
      enqueueSnackbar(typeof error === 'string' ? error : 'Failed to update status', {
        variant: 'error',
      });
    }
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>, newStatus: LeadStatus) => {
    event.preventDefault();
    if (!draggedLeadId) {
      return;
    }
    await handleStatusChange(draggedLeadId, newStatus);
    setDraggedLeadId(null);
  };

  const getLeadsByStatus = (status: LeadStatus) => leads.filter((lead) => lead.status === status);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Sales Pipeline
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Drag and drop leads between stages to update their status
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(6, 1fr)',
          },
          gap: 2,
        }}
      >
        {pipelineStages.map((status) => {
          const stageLeads = getLeadsByStatus(status);
          const totalValue = stageLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);

          return (
            <Paper
              key={status}
              onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
              onDrop={(event: DragEvent<HTMLDivElement>) => handleDrop(event, status)}
              sx={{
                p: 2,
                bgcolor: 'background.default',
                minHeight: '70vh',
                border: '2px solid',
                borderColor: LEAD_STATUS_COLORS[status],
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={LEAD_STATUS_LABELS[status]}
                  sx={{
                    bgcolor: LEAD_STATUS_COLORS[status],
                    color: 'white',
                    fontWeight: 'bold',
                    width: '100%',
                  }}
                />
                <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
                  {stageLeads.length} leads • ₹{(totalValue / 100000).toFixed(1)}L
                </Typography>
              </Box>

              <Box>
                {stageLeads.map((lead) => (
                  <Paper
                    key={lead._id}
                    draggable
                    onDragStart={() => setDraggedLeadId(lead._id)}
                    onDragEnd={() => setDraggedLeadId(null)}
                    sx={{
                      p: 2,
                      mb: 1.5,
                      cursor: 'grab',
                      opacity: draggedLeadId === lead._id ? 0.6 : 1,
                      '&:hover': { boxShadow: 3 },
                      '&:active': { cursor: 'grabbing' },
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight="bold" noWrap>
                      {lead.companyName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {lead.contactPerson}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium" sx={{ mt: 1 }}>
                      ₹{(lead.estimatedValue || 0).toLocaleString()}
                    </Typography>
                    <Chip
                      label={lead.priority}
                      size="small"
                      sx={{ mt: 1, textTransform: 'capitalize', height: 20, fontSize: '0.7rem' }}
                      color={priorityColor(lead.priority)}
                    />
                  </Paper>
                ))}

                {stageLeads.length === 0 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    align="center"
                    display="block"
                    sx={{ mt: 4 }}
                  >
                    No leads in this stage
                  </Typography>
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
};

export default Pipeline;
