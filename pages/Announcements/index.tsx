import { Group, SimpleGrid, Stack, Image, Box, Card, Text, Loader, Badge } from "@mantine/core";
import styles from "../../styles/Template.module.css";
import React, { useEffect, useState } from "react";
import { ArrowBack, Notifications, ErrorOutline } from "@material-ui/icons";
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

// Define announcement interface
interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  urgent?: boolean;
}

export default function Announcements() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const goBack = () => {
    router.push('/');
  };

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('urgent', { ascending: false }) // Urgent announcements first
        .order('created_at', { ascending: false }); // Then newest first

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
          const newAnnouncement = payload.new as Announcement;
          // Place urgent announcements at the top
          setAnnouncements(current => {
            const newList = [...current];
            if (newAnnouncement.urgent) {
              // Find the last urgent announcement
              const lastUrgentIndex = newList.findIndex(a => !a.urgent);
              if (lastUrgentIndex === -1) {
                // No non-urgent announcements, just add to the beginning
                return [newAnnouncement, ...newList];
              } else {
                // Insert after the last urgent announcement
                newList.splice(lastUrgentIndex, 0, newAnnouncement);
                return newList;
              }
            } else {
              // For non-urgent, just add to the list after all urgent ones
              return [newAnnouncement, ...newList];
            }
          });
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
              <BreadcrumbPage className="text-white">Announcements</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </SimpleGrid>

      <Group className={styles.bottom} style={{ position: 'relative', zIndex: 1 }}>
        <ScrollArea style={{ height: 'calc(100vh - 70px)', width: '100%', padding: '1rem' }}>
          <Stack style={{ width: '90%', maxWidth: '800px', margin: '0 auto' }} spacing="md">
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Group position="apart">
                <Group>
                  <Notifications style={{ color: "#3f6cd4" }} />
                  <Text fw={700} size="lg">Announcements</Text>
                </Group>
                {announcements.filter(a => a.urgent).length > 0 && (
                  <Group spacing="xs">
                    <ErrorOutline style={{ color: "red", fontSize: 18 }} />
                    <Text size="sm" c="red" fw={500}>{announcements.filter(a => a.urgent).length} urgent</Text>
                  </Group>
                )}
              </Group>
            </Card>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Loader color="blue" />
              </div>
            ) : announcements.length === 0 ? (
              <Card shadow="sm" p="xl" radius="md" withBorder>
                <Text align="center" py="md">No announcements at this time.</Text>
              </Card>
            ) : (
              <Stack spacing="md">
                {announcements.map(announcement => (
                  <Card 
                    key={announcement.id} 
                    shadow="sm" 
                    p="md" 
                    radius="md" 
                    withBorder
                    style={{
                      borderLeft: announcement.urgent ? '4px solid red' : undefined
                    }}
                  >
                    <Stack>
                      <Group position="apart">
                        <Group spacing="xs">
                          <Text fw={700}>{announcement.title}</Text>
                          {announcement.urgent && (
                            <Badge color="red">Urgent</Badge>
                          )}
                        </Group>
                        <Text size="xs" c="dimmed">{formatDate(announcement.created_at)}</Text>
                      </Group>
                      
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{announcement.content}</Text>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </ScrollArea>
      </Group>
      
      <Box style={{ position: "fixed", bottom: 0, width: "100vw", zIndex: 0 }}>
        <Image src="../../images/vector.svg" radius="md" style={{ width: "100%", margin: 0 }} />
      </Box>
    </Stack>
  );
}