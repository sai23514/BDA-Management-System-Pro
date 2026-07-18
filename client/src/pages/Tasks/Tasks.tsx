import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  IconButton,
} from '@mui/material';
import { CheckCircleOutline, OpenInNew } from '@mui/icons-material';
import { format, isBefore, startOfDay } from 'date-fns';
import { useSnackbar } from 'notistack';
import api, { getApiErrorMessage } from '../../services/api';
import type { TaskItem, LeadRef } from '../../types';

type TaskFilter = 'all' | 'today' | 'overdue' | 'upcoming';

const isLeadRef = (value: TaskItem['leadId']): value is LeadRef =>
  Boolean(value) && typeof value === 'object';

const Tasks = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: { tasks: TaskItem[] } }>('/activities/my-tasks', {
        params: { filter },
      });
      setTasks(res.data.data.tasks);
    } catch (error) {
      enqueueSnackbar(getApiErrorMessage(error, 'Failed to load tasks'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filter, enqueueSnackbar]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleComplete = async (id: string) => {
    try {
      await api.patch(`/activities/${id}/complete`);
      enqueueSnackbar('Task completed', { variant: 'success' });
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (error) {
      enqueueSnackbar(getApiErrorMessage(error, 'Failed to complete task'), { variant: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        My Tasks
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Follow-ups and to-dos assigned to you
      </Typography>

      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(_, value: TaskFilter | null) => value && setFilter(value)}
        size="small"
        sx={{ mb: 3 }}
      >
        <ToggleButton value="all">All</ToggleButton>
        <ToggleButton value="today">Today</ToggleButton>
        <ToggleButton value="overdue">Overdue</ToggleButton>
        <ToggleButton value="upcoming">Upcoming</ToggleButton>
      </ToggleButtonGroup>

      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : tasks.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No tasks here. You are all caught up!
            </Typography>
          </Box>
        ) : (
          <List>
            {tasks.map((task) => {
              const overdue =
                task.dueDate && isBefore(new Date(task.dueDate), startOfDay(new Date()));
              return (
                <ListItem
                  key={task._id}
                  divider
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {isLeadRef(task.leadId) && (
                        <IconButton
                          edge="end"
                          onClick={() =>
                            isLeadRef(task.leadId) && navigate(`/leads/${task.leadId._id}`)
                          }
                        >
                          <OpenInNew fontSize="small" />
                        </IconButton>
                      )}
                      <Button
                        size="small"
                        startIcon={<CheckCircleOutline />}
                        onClick={() => handleComplete(task._id)}
                      >
                        Done
                      </Button>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">{task.subject}</Typography>
                        <Chip label={task.type} size="small" sx={{ textTransform: 'capitalize' }} />
                        {overdue && <Chip label="Overdue" size="small" color="error" />}
                      </Box>
                    }
                    secondary={
                      <>
                        {isLeadRef(task.leadId) ? `${task.leadId.companyName} • ` : ''}
                        {task.dueDate
                          ? `Due ${format(new Date(task.dueDate), 'MMM dd, yyyy')}`
                          : 'No due date'}
                      </>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default Tasks;
