import { Group, SimpleGrid, Stack, Button, Text, Image, Box, Card, Badge, Select, Loader } from "@mantine/core";
import styles from "../../../styles/Template.module.css";
import React, { useEffect, useState } from "react";
import { ArrowBack, AccountCircle } from "@material-ui/icons";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useRouter } from "next/router";
import supabase from '@/utils/supabase/client';
import { ScrollArea } from "@mantine/core";
import withAdminAuth from "@/components/withAdminAuth"; // Import the HOC

// Define the type for maintenance requests
interface MaintenanceRequest {
  id: string;
  name: string;
  floor: number;
  wing: string;
  room_number: string;
  description: string;
  status: "Pending" | "Rejected" | "On Going" | "Completed";
  created_at: string;
  user_id?: string;
}

// Get color based on status
const getStatusColor = (status: string) => {
  switch (status) {
    case "Pending":
      return "yellow";
    case "Rejected":
      return "red";
    case "On Going":
      return "blue";
    case "Completed":
      return "green";
    default:
      return "gray";
  }
};

// Create the component (not exported yet)
function MaintenanceRequests() {
  const router = useRouter();
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const goBack = () => {
    router.push('/Admin');
  };

  // Rest of your component implementation...
  // Fetch maintenance requests from Supabase
  const fetchMaintenanceRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching maintenance requests:", error);
        return;
      }
      
      setMaintenanceRequests(data || []);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update request status
  const updateRequestStatus = async (id: string, newStatus: "Pending" | "Rejected" | "On Going" | "Completed") => {
    try {
      setUpdatingId(id);
      
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) {
        console.error("Error updating status:", error);
        return;
      }
      
      // Update the local state
      setMaintenanceRequests(requests => 
        requests.map(request => 
          request.id === id ? { ...request, status: newStatus } : request
        )
      );
    } catch (error) {
      console.error("Unexpected error during update:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  // Setup real-time subscription for updates
  useEffect(() => {
    fetchMaintenanceRequests();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('maintenance_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'maintenance_requests' 
      }, payload => {
        if (payload.eventType === 'INSERT') {
          // Add new request to the list
          setMaintenanceRequests(current => [payload.new as MaintenanceRequest, ...current]);
        } else if (payload.eventType === 'UPDATE') {
          // Update the changed request
          setMaintenanceRequests(current => 
            current.map(item => 
              item.id === payload.new.id ? (payload.new as MaintenanceRequest) : item
            )
          );
        } else if (payload.eventType === 'DELETE') {
          // Remove the deleted request
          setMaintenanceRequests(current => 
            current.filter(item => item.id !== payload.old.id)
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
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
              <BreadcrumbPage className="text-white">Maintenance Requests</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </SimpleGrid>

      <Group className={styles.bottom} style={{ position: 'relative', zIndex: 1 }}>
        <ScrollArea style={{ height: 'calc(100vh - 70px)', width: '100%', padding: '1rem' }}>
          <Stack style={{ width: '90%', maxWidth: '1000px', margin: '0 auto' }} spacing="md">
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack>
                <Text fw={700} size="lg">Maintenance Requests</Text>
                <Text size="sm" c="dimmed">Manage maintenance requests submitted by students</Text>
              </Stack>
            </Card>

            {loading ? (
              <Card shadow="sm" p="xl" radius="md" withBorder style={{ display: 'flex', justifyContent: 'center' }}>
                <Loader color="blue" />
              </Card>
            ) : maintenanceRequests.length === 0 ? (
              <Card shadow="sm" p="xl" radius="md" withBorder>
                <Text align="center">No maintenance requests found</Text>
              </Card>
            ) : (
              maintenanceRequests.map((request) => (
                <Card key={request.id} shadow="sm" p="md" radius="md" withBorder>
                  <Stack>
                    <Group position="apart">
                      <Text fw={600}>{request.name}</Text>
                      <Badge color={getStatusColor(request.status)}>{request.status}</Badge>
                    </Group>
                    
                    <Group spacing="xs">
                      <Text size="sm" fw={500}>Room:</Text>
                      <Text size="sm">{request.wing} Wing, Floor {request.floor}, Room {request.room_number}</Text>
                    </Group>
                    
                    <Text size="sm" c="dimmed">Submitted: {formatDate(request.created_at)}</Text>
                    
                    <Card withBorder padding="xs">
                      <Text size="sm">{request.description}</Text>
                    </Card>
                    
                    <Group position="right">
                      {updatingId === request.id ? (
                        <Loader size="sm" />
                      ) : (
                        <Select
                          value={request.status}
                          onChange={(value) => {
                            if (value && ['Pending', 'Rejected', 'On Going', 'Completed'].includes(value)) {
                              updateRequestStatus(
                                request.id, 
                                value as "Pending" | "Rejected" | "On Going" | "Completed"
                              );
                            }
                          }}
                          data={[
                            { value: 'Pending', label: 'Pending' },
                            { value: 'Rejected', label: 'Rejected' },
                            { value: 'On Going', label: 'On Going' },
                            { value: 'Completed', label: 'Completed' },
                          ]}
                          style={{ width: '150px' }}
                        />
                      )}
                    </Group>
                  </Stack>
                </Card>
              ))
            )}
          </Stack>
        </ScrollArea>
      </Group>
      
      <Box style={{ position: "fixed", bottom: 0, width: "100vw", zIndex: 0 }}>
        <Image src="../../../images/vector.svg" radius="md" style={{ width: "100%", margin: 0 }} />
      </Box>
    </Stack>
  );
}

// Export the component wrapped with the admin authentication HOC
export default withAdminAuth(MaintenanceRequests);