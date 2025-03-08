import { Group, SimpleGrid, Stack, Button, TextInput, Textarea, Image, Box, Text, Card, Loader, Badge } from "@mantine/core";
import styles from "../../styles/Template.module.css";
import classes from "../../styles/Mantine/FloatingLabelInput.module.css";
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
import { FloorDrawer } from "../components/FloorDrawer";
import { WingDrawer } from "../components/WingDrawer";
import { useRouter } from "next/router";
import supabase from '@/utils/supabase/client';
import { ScrollArea, Modal } from "@mantine/core";
import { showNotification } from "@mantine/notifications";

// Interface for maintenance requests
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

export default function MaintenanceStudent() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [focusedName, setFocused] = useState(false);
  const [name, setName] = useState("");
  const floatingName = name.trim().length !== 0 || focusedName || undefined;
  const [selectedFloor, setSelectedFloor] = useState<number>(0);
  const [selectedWing, setSelectedWing] = useState<string>("");

  const [focusedRoom, setFocusedRoom] = useState(false);
  const [room, setRoom] = useState("");
  const floatingRoom = room.trim().length !== 0 || focusedRoom || undefined;
  
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [userRequests, setUserRequests] = useState<MaintenanceRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  useEffect(() => {
    const date_obj = new Date();
    const day = date_obj.getDate();
    const month = date_obj.getMonth() + 1;
    const year = date_obj.getFullYear();
    setDate(`${day}/${month}/${year}`);
    
    // Get user data
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    fetchUser();
  }, []);
  
  const goBack = () => {
    router.push('/');
  };

  // Submit the maintenance request
  const handleSubmit = async () => {
    // Validate input
    if (!name.trim()) {
      showNotification({
        title: "Error",
        message: "Please enter your name",
        color: "red",
      });
      return;
    }
    
    if (selectedFloor === 0) {
      showNotification({
        title: "Error",
        message: "Please select a floor",
        color: "red",
      });
      return;
    }
    
    if (!selectedWing) {
      showNotification({
        title: "Error",
        message: "Please select a wing",
        color: "red",
      });
      return;
    }
    
    if (!room.trim()) {
      showNotification({
        title: "Error",
        message: "Please enter your room number",
        color: "red",
      });
      return;
    }
    
    if (!description.trim()) {
      showNotification({
        title: "Error",
        message: "Please describe your issue",
        color: "red",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const requestData = {
        name,
        floor: selectedFloor,
        wing: selectedWing,
        room_number: room,
        description,
        status: "Pending" as const,
        user_id: user?.id || null,
      };
      
      const { error } = await supabase
        .from('maintenance_requests')
        .insert([requestData]);
      
      if (error) {
        console.error("Error submitting request:", error);
        showNotification({
          title: "Error",
          message: "Failed to submit request. Please try again.",
          color: "red",
        });
        return;
      }
      
      showNotification({
        title: "Success",
        message: "Your maintenance request has been submitted!",
        color: "green",
      });
      
      // Reset form
      setName("");
      setSelectedFloor(0);
      setSelectedWing("");
      setRoom("");
      setDescription("");
      
    } catch (error) {
      console.error("Unexpected error:", error);
      showNotification({
        title: "Error",
        message: "Something went wrong. Please try again.",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Fetch user's request history
  const fetchUserRequests = async () => {
    if (!user) return;
    
    try {
      setLoadingHistory(true);
      
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching user requests:", error);
        return;
      }
      
      setUserRequests(data || []);
      setShowHistory(true);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoadingHistory(false);
    }
  };
  
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
              <BreadcrumbPage className="text-white">Maintenance Issues</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </SimpleGrid>

      <Group className={styles.bottom}>
        <ScrollArea style={{ height: 'calc(100vh - 70px)', width: '100%' }}>
          <SimpleGrid cols={1} style={{ width: "80%", margin: "0 auto", padding: "1rem 0", zIndex: 10 }} spacing="3rem">
            <TextInput
                label="Name"
                placeholder="Enter your name"
                required
                classNames={classes}
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoComplete="nope"
                data-floating={floatingName}
                labelProps={{ 'data-floating': floatingName }}
                radius={10}
                disabled={isSubmitting}
            />
            <FloorDrawer 
              selectedFloor={selectedFloor}
              setSelectedFloor={setSelectedFloor}
              disabled={isSubmitting}
            />
            <WingDrawer 
              selectedWing={selectedWing}
              setSelectedWing={setSelectedWing}
              disabled={isSubmitting}
            />
            <TextInput
                label="Room Number"
                required
                classNames={classes}
                value={room}
                onChange={(event) => setRoom(event.currentTarget.value)}
                onFocus={() => setFocusedRoom(true)}
                onBlur={() => setFocusedRoom(false)}
                autoComplete="nope"
                data-floating={floatingRoom}
                labelProps={{ 'data-floating': floatingRoom }}
                radius={10}
                disabled={isSubmitting}
            />

            <Textarea
              label="Issue Description"
              placeholder="Brief your issue here..."
              autosize
              minRows={4}
              maxRows={4}
              style={{ color: "black" }}
              radius={10}
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
              disabled={isSubmitting}
            />
            <Stack justify="centre" style={{ width: "100%", display: "flex", alignItems: "center" }} gap="xl">
              <Button 
                variant="outline" 
                color="blue" 
                style={{ width: "100%", borderRadius: 10 }}
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Submit
              </Button>
              <Button 
                variant="outline" 
                color="blue" 
                style={{ width: "50%", borderRadius: 10 }}
                onClick={fetchUserRequests}
                disabled={isSubmitting || !user}
              >
                Issues History
              </Button>
            </Stack>
          </SimpleGrid>
        </ScrollArea>
      </Group>
      
      {/* History Modal */}
      <Modal
        opened={showHistory}
        onClose={() => setShowHistory(false)}
        title="Your Maintenance Requests"
        size="lg"
      >
        {loadingHistory ? (
          <Loader style={{ margin: "2rem auto", display: "block" }} />
        ) : userRequests.length > 0 ? (
          <Stack spacing="md">
            {userRequests.map(request => (
              <Card key={request.id} shadow="sm" padding="md" radius="md" withBorder>
                <Stack>
                  <Group position="apart">
                    <Text fw={600}>Room: {request.wing} Wing, Floor {request.floor}, Room {request.room_number}</Text>
                    <Badge color={getStatusColor(request.status)}>{request.status}</Badge>
                  </Group>
                  <Text size="sm" c="dimmed">Submitted: {formatDate(request.created_at)}</Text>
                  <Text size="sm">{request.description}</Text>
                </Stack>
              </Card>
            ))}
          </Stack>
        ) : (
          <Text align="center" py="xl">You haven't submitted any maintenance requests yet.</Text>
        )}
      </Modal>
      
      <Box className={styles.vectorBackground}>
        <Image src="../../images/vector.svg" radius="md" style={{ width: "100%", margin: 0 }} />
      </Box>
    </Stack>
  );
}