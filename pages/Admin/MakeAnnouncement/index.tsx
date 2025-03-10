import { Group, SimpleGrid, Stack, Button, TextInput, Textarea, Image, Box, Card, Text, Loader, Badge } from "@mantine/core";
import styles from "../../../styles/Template.module.css";
import classes from "../../../styles/Mantine/FloatingLabelInput.module.css";
import React, { useEffect, useState } from "react";
import { ArrowBack, Send, DeleteOutline } from "@material-ui/icons";
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
import { ScrollArea } from "@mantine/core";
import withAdminAuth from "@/components/withAdminAuth";
import { showNotification } from '@mantine/notifications';

// Define announcement interface
interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  urgent?: boolean;
}

function MakeAnnouncement() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [titleFocused, setTitleFocused] = useState(false);
  const [content, setContent] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const floatingTitle = title.trim().length !== 0 || titleFocused || undefined;

  const goBack = () => {
    router.push('/Admin');
  };

  // Fetch existing announcements
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching announcements:", error);
        return;
      }

      setAnnouncements(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Post a new announcement
  const postAnnouncement = async () => {
    // Validate input
    if (!title.trim()) {
      showNotification({
        title: 'Error',
        message: 'Please enter an announcement title',
        color: 'red',
      });
      return;
    }

    if (!content.trim()) {
      showNotification({
        title: 'Error',
        message: 'Please enter announcement content',
        color: 'red',
      });
      return;
    }

    try {
      setSubmitting(true);

      const announcementData = {
        title: title.trim(),
        content: content.trim(),
        urgent: isUrgent,
      };

      const { error } = await supabase
        .from('announcements')
        .insert([announcementData]);

      if (error) {
        console.error("Error posting announcement:", error);
        showNotification({
          title: 'Error',
          message: 'Failed to post announcement. Please try again.',
          color: 'red',
        });
        return;
      }

      showNotification({
        title: 'Success',
        message: 'Announcement has been posted successfully!',
        color: 'green',
      });

      // Clear form
      setTitle("");
      setContent("");
      setIsUrgent(false);

      // Refresh announcements list
      fetchAnnouncements();
    } catch (error) {
      console.error("Error:", error);
      showNotification({
        title: 'Error',
        message: 'An unexpected error occurred. Please try again.',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete an announcement
  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      setDeleting(id);

      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting announcement:", error);
        showNotification({
          title: 'Error',
          message: 'Failed to delete announcement. Please try again.',
          color: 'red',
        });
        return;
      }

      showNotification({
        title: 'Success',
        message: 'Announcement has been deleted successfully!',
        color: 'green',
      });

      // Update local state
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setDeleting(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Set up realtime subscription
  useEffect(() => {
    fetchAnnouncements();

    const subscription = supabase
      .channel('announcements_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'announcements'
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setAnnouncements(current => [payload.new as Announcement, ...current]);
        } else if (payload.eventType === 'DELETE') {
          setAnnouncements(current => current.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

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
              <BreadcrumbPage className="text-white">Make Announcement</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </SimpleGrid>

      <Group className={styles.bottom} style={{ position: 'relative', zIndex: 1 }}>
        <ScrollArea style={{ height: 'calc(100vh - 70px)', width: '100%', padding: '1rem' }}>
          <Stack style={{ width: '90%', maxWidth: '1000px', margin: '0 auto' }} gap="xl">
            {/* Announcement Creation Form */}
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack>
                <Text fw={700} size="lg">Create New Announcement</Text>
                
                <TextInput
                  label="Announcement Title"
                  required
                  classNames={classes}
                  value={title}
                  onChange={(event) => setTitle(event.currentTarget.value)}
                  onFocus={() => setTitleFocused(true)}
                  onBlur={() => setTitleFocused(false)}
                  autoComplete="off"
                  data-floating={floatingTitle}
                  labelProps={{ 'data-floating': floatingTitle }}
                  radius={10}
                  disabled={submitting}
                />
                
                <Textarea
                  label="Announcement Content"
                  placeholder="Type your announcement message here..."
                  autosize
                  minRows={4}
                  maxRows={6}
                  style={{ color: "black" }}
                  radius={10}
                  value={content}
                  onChange={(event) => setContent(event.currentTarget.value)}
                  disabled={submitting}
                />
                
                <Group justify="apart">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="checkbox" 
                      id="urgentCheck" 
                      checked={isUrgent}
                      onChange={() => setIsUrgent(!isUrgent)}
                      disabled={submitting}
                    />
                    <label htmlFor="urgentCheck">Mark as urgent</label>
                  </div>
                  
                  <Button 
                    variant="filled" 
                    color="blue" 
                    style={{ borderRadius: 10 }}
                    onClick={postAnnouncement}
                    loading={submitting}
                    disabled={submitting}
                    leftSection={<Send fontSize="small" />}
                  >
                    Post Announcement
                  </Button>
                </Group>
              </Stack>
            </Card>

            {/* List of Existing Announcements */}
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack>
                <Text fw={700} size="lg">Recent Announcements</Text>
                
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <Loader color="blue" />
                  </div>
                ) : announcements.length === 0 ? (
                  <Text ta="center" py="xl" c="dimmed">No announcements have been posted yet.</Text>
                ) : (
                  <Stack gap="md">
                    {announcements.map(announcement => (
                      <Card key={announcement.id} shadow="sm" p="md" radius="md" withBorder>
                        <Stack>
                          <Group justify="apart">
                            <div>
                              <Group gap="xs">
                                <Text fw={700}>{announcement.title}</Text>
                                {announcement.urgent && (
                                  <Badge color="red">Urgent</Badge>
                                )}
                              </Group>
                            </div>
                            
                            <Button
                              variant="subtle"
                              color="red"
                              size="xs"
                              loading={deleting === announcement.id}
                              disabled={!!deleting}
                              onClick={() => deleteAnnouncement(announcement.id)}
                            >
                              <DeleteOutline fontSize="small" />
                            </Button>
                          </Group>
                          
                          <Text size="sm" c="dimmed">Posted: {formatDate(announcement.created_at)}</Text>
                          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{announcement.content}</Text>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Card>
          </Stack>
        </ScrollArea>
      </Group>
      
      <Box style={{ position: "fixed", bottom: 0, width: "100vw", zIndex: 0 }}>
        <Image src="../../../images/vector.svg" radius="md" style={{ width: "100%", margin: 0 }} alt=""/>
      </Box>
    </Stack>
  );
}

export default withAdminAuth(MakeAnnouncement);