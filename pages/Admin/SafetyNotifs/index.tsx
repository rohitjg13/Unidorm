import { Group, SimpleGrid, Stack, Button, Text, Image, Box, Card, TextInput, Textarea, NumberInput, ActionIcon, Modal, Select } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import styles from "../../../styles/Template.module.css";
import React, { useEffect, useState } from "react";
import { ArrowBack, Add, Edit, Delete, EventAvailable, AccessTime } from "@material-ui/icons";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRouter } from "next/router";
import supabase from '@/utils/supabase/client';
import { ScrollArea, Loader } from "@mantine/core";
import withAdminAuth from "@/components/withAdminAuth";
import { showNotification } from '@mantine/notifications';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button as ShadcnButton } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SafetyNotification {
  id: string;
  title: string;
  description: string;
  notification_date: string;
  notification_time: string;
  affected_persons: number;
  is_active: boolean;
  created_at: string;
}

function SafetyNotifsAdmin() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<SafetyNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notificationDate, setNotificationDate] = useState<Date | null>(new Date());
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [affectedPersons, setAffectedPersons] = useState<number | ''>(0);
  const [isActive, setIsActive] = useState(true);
  const [currentNotification, setCurrentNotification] = useState<SafetyNotification | null>(null);
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('safety_notifications')
        .select('*')
        .order('notification_date', { ascending: true })
        .order('notification_time', { ascending: true });
      
      if (error) {
        console.error("Error fetching safety notifications:", error);
        showNotification({
          title: 'Error',
          message: 'Failed to load safety notifications.',
          color: 'red',
        });
        return;
      }
      
      setNotifications(data || []);
    } catch (error) {
      console.error("Error in fetchNotifications:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateNotification = async () => {
    try {
      if (!title.trim() || !description.trim() || !notificationDate || !notificationTime) {
        showNotification({
          title: 'Missing Information',
          message: 'Please fill in all required fields.',
          color: 'yellow',
        });
        return;
      }
      
      // Format date for Supabase (YYYY-MM-DD)
      const formattedDate = notificationDate.toISOString().split('T')[0];
      
      const newNotification = {
        title: title.trim(),
        description: description.trim(),
        notification_date: formattedDate,
        notification_time: notificationTime,
        affected_persons: affectedPersons === '' ? 0 : affectedPersons,
        is_active: isActive
      };
      
      const { data, error } = await supabase
        .from('safety_notifications')
        .insert([newNotification])
        .select();
      
      if (error) {
        console.error("Error creating safety notification:", error);
        showNotification({
          title: 'Error',
          message: 'Failed to create safety notification.',
          color: 'red',
        });
        return;
      }
      
      showNotification({
        title: 'Success',
        message: 'Safety notification created successfully.',
        color: 'green',
      });
      
      // Refresh notifications list
      fetchNotifications();
      
      // Reset form
      setTitle("");
      setDescription("");
      setNotificationDate(new Date());
      setNotificationTime('09:00');
      setAffectedPersons(0);
      setIsActive(true);
      
      // Close modal
      setCreateModalOpen(false);
    } catch (error) {
      console.error("Error in handleCreateNotification:", error);
    }
  };
  
  const handleEditNotification = async () => {
    try {
      if (!currentNotification) return;
      
      if (!title.trim() || !description.trim() || !notificationDate || !notificationTime) {
        showNotification({
          title: 'Missing Information',
          message: 'Please fill in all required fields.',
          color: 'yellow',
        });
        return;
      }
      
      // Format date for Supabase (YYYY-MM-DD)
      const formattedDate = notificationDate.toISOString().split('T')[0];
      
      const updatedNotification = {
        title: title.trim(),
        description: description.trim(),
        notification_date: formattedDate,
        notification_time: notificationTime,
        affected_persons: affectedPersons === '' ? 0 : affectedPersons,
        is_active: isActive
      };
      
      const { error } = await supabase
        .from('safety_notifications')
        .update(updatedNotification)
        .eq('id', currentNotification.id);
      
      if (error) {
        console.error("Error updating safety notification:", error);
        showNotification({
          title: 'Error',
          message: 'Failed to update safety notification.',
          color: 'red',
        });
        return;
      }
      
      showNotification({
        title: 'Success',
        message: 'Safety notification updated successfully.',
        color: 'green',
      });
      
      // Refresh notifications list
      fetchNotifications();
      
      // Close modal
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error in handleEditNotification:", error);
    }
  };
  
  const handleDeleteNotification = async () => {
    try {
      if (!currentNotification) return;
      
      const { error } = await supabase
        .from('safety_notifications')
        .delete()
        .eq('id', currentNotification.id);
      
      if (error) {
        console.error("Error deleting safety notification:", error);
        showNotification({
          title: 'Error',
          message: 'Failed to delete safety notification.',
          color: 'red',
        });
        return;
      }
      
      showNotification({
        title: 'Success',
        message: 'Safety notification deleted successfully.',
        color: 'green',
      });
      
      // Refresh notifications list
      fetchNotifications();
      
      // Close modal
      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Error in handleDeleteNotification:", error);
    }
  };
  
  const openEditModal = (notification: SafetyNotification) => {
    setCurrentNotification(notification);
    setTitle(notification.title);
    setDescription(notification.description);
    setNotificationDate(new Date(notification.notification_date));
    setNotificationTime(notification.notification_time.substring(0, 5));
    setAffectedPersons(notification.affected_persons);
    setIsActive(notification.is_active);
    setEditModalOpen(true);
  };
  
  const openDeleteModal = (notification: SafetyNotification) => {
    setCurrentNotification(notification);
    setDeleteModalOpen(true);
  };
  
  const openCreateModal = () => {
    // Reset form fields
    setTitle("");
    setDescription("");
    setNotificationDate(new Date());
    setNotificationTime('09:00');
    setAffectedPersons(0);
    setIsActive(true);
    setCreateModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const formatTime = (timeString: string) => {
    // Format from 24-hour time to 12-hour time (e.g. "14:30:00" to "2:30 PM")
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  };
  
  const goBack = () => {
    router.push('/Admin');
  };

  return (
    <Stack justify="flex-start" gap={0} className={styles.container}>
      <SimpleGrid className={styles.header} cols={2}>
        <ArrowBack 
          style={{ scale: "1.75", color: "white", cursor: "pointer" }} 
          onClick={goBack}
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink style={{color: "#dedede"}} href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white" />
            <BreadcrumbItem>
              <BreadcrumbLink style={{color: "#dedede"}} href="/Admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white">Safety Notifications</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </SimpleGrid>

      <Group className={styles.bottom} style={{ position: 'relative', zIndex: 1 }}>
        <ScrollArea style={{ height: 'calc(100vh - 70px)', width: '100%', padding: '1rem' }}>
          <Stack style={{ width: '90%', maxWidth: '1000px', margin: '0 auto' }} gap="md">
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack>
                <Group justify="apart">
                  <Text fw={700} size="lg">Safety Notifications</Text>
                  <Button 
                    leftSection={<Add />} 
                    onClick={openCreateModal}
                    color="blue"
                  >
                    Add New Notification
                  </Button>
                </Group>
                <Text size="sm" c="dimmed">Manage safety notifications for students</Text>
              </Stack>
            </Card>

            {loading ? (
              <Card shadow="sm" p="xl" radius="md" withBorder style={{ display: 'flex', justifyContent: 'center' }}>
                <Loader color="blue" />
              </Card>
            ) : notifications.length === 0 ? (
              <Card shadow="sm" p="xl" radius="md" withBorder>
                <Text ta="center">No safety notifications found. Create one to get started.</Text>
              </Card>
            ) : (
              <Stack gap="md">
                {notifications.map(notification => (
                  <Card key={notification.id} shadow="sm" p="md" radius="md" withBorder>
                    <Stack>
                      <Group justify="apart">
                        <Text fw={600}>{notification.title}</Text>
                        <Group gap={8}>
                          <ActionIcon color="blue" onClick={() => openEditModal(notification)}>
                            <Edit fontSize="small" />
                          </ActionIcon>
                          <ActionIcon color="red" onClick={() => openDeleteModal(notification)}>
                            <Delete fontSize="small" />
                          </ActionIcon>
                        </Group>
                      </Group>
                      
                      <Text size="sm">{notification.description}</Text>
                      
                      <Group gap="md">
                        <Group gap={4}>
                          <EventAvailable style={{ fontSize: '1rem', color: '#777' }} />
                          <Text size="xs" c="dimmed">{formatDate(notification.notification_date)}</Text>
                        </Group>
                        <Group gap={4}>
                          <AccessTime style={{ fontSize: '1rem', color: '#777' }} />
                          <Text size="xs" c="dimmed">{formatTime(notification.notification_time)}</Text>
                        </Group>
                      </Group>
                      
                      <Group justify="apart">
                        <Text size="xs" c="dimmed">
                          {notification.affected_persons === 0 ? 
                            "No crowd information available" : 
                            `Expected attendance: ${notification.affected_persons} ${notification.affected_persons === 1 ? 'person' : 'people'}`}
                        </Text>
                        <Text size="xs" fw={500} color={notification.is_active ? "green" : "red"}>
                          {notification.is_active ? "Active" : "Inactive"}
                        </Text>
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </ScrollArea>
      </Group>

      {/* Create Notification Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Safety Notification"
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Title"
            placeholder="Fire Alarm Testing"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            required
          />
          
          <Textarea
            label="Description"
            placeholder="Describe the safety notification..."
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            minRows={3}
            required
          />
          
          <div className="space-y-2 relative z-50">
            <label className="text-sm font-medium">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <ShadcnButton
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !notificationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {notificationDate ? format(notificationDate, "PPP") : <span>Pick a date</span>}
                </ShadcnButton>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[200]" align="start">
                <Calendar
                  mode="single"
                  selected={notificationDate || undefined}
                  onSelect={(date) => setNotificationDate(date || null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <TimeInput
            label="Time"
            format="24"
            value={notificationTime}
            onChange={(value) => setNotificationTime(value)}
            required
            clearable={false}
            size="md"
          />
          
          <NumberInput
            label="Expected People (0 = No information available)"
            placeholder="0"
            value={affectedPersons}
            onChange={(value) => setAffectedPersons(value)}
            min={0}
          />
          
          <Select
            label="Status"
            data={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' }
            ]}
            value={isActive ? 'true' : 'false'}
            onChange={(value) => setIsActive(value === 'true')}
          />
          
          <Group justify="right" mt="md">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button color="blue" onClick={handleCreateNotification}>Create Notification</Button>
          </Group>
        </Stack>
      </Modal>
      
      {/* Edit Notification Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Safety Notification"
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Title"
            placeholder="Fire Alarm Testing"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            required
          />
          
          <Textarea
            label="Description"
            placeholder="Describe the safety notification..."
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            minRows={3}
            required
          />
          
          <div className="space-y-2 relative z-50">
            <label className="text-sm font-medium">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <ShadcnButton
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !notificationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {notificationDate ? format(notificationDate, "PPP") : <span>Pick a date</span>}
                </ShadcnButton>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[200]" align="start">
                <Calendar
                  mode="single"
                  selected={notificationDate || undefined}
                  onSelect={(date) => setNotificationDate(date || null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <TimeInput
            label="Time"
            format="24"
            value={notificationTime}
            onChange={(value) => setNotificationTime(value)}
            required
            clearable={false}
            size="md"
          />
          
          <NumberInput
            label="Expected People (0 = No information available)"
            placeholder="0"
            value={affectedPersons}
            onChange={(value) => setAffectedPersons(value)}
            min={0}
          />
          
          <Select
            label="Status"
            data={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' }
            ]}
            value={isActive ? 'true' : 'false'}
            onChange={(value) => setIsActive(value === 'true')}
          />
          
          <Group justify="right" mt="md">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button color="blue" onClick={handleEditNotification}>Save Changes</Button>
          </Group>
        </Stack>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Safety Notification"
        size="sm"
      >
        <Stack gap="md">
          <Text>Are you sure you want to delete this safety notification?</Text>
          <Text fw={500} size="sm">{currentNotification?.title}</Text>
          
          <Group justify="right" mt="md">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button color="red" onClick={handleDeleteNotification}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
      
      <Box style={{ position: "fixed", bottom: 0, width: "100vw", zIndex: 0 }}>
        <Image src="../../../images/vector.svg" radius="md" style={{ width: "100%", margin: 0 }} alt="" />
      </Box>
    </Stack>
  );
}

export default withAdminAuth(SafetyNotifsAdmin);