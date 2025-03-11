import { Group, SimpleGrid, Stack, Button, Text, Divider, Box, Image, Loader } from "@mantine/core";
import styles from "../../styles/Template.module.css";
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
import { Schedule, Group as GroupIcon } from "@material-ui/icons";
import { useRouter } from "next/router";
import supabase from "@/utils/supabase/client";

interface SafetyNotification {
  id: string;
  created_at: string;
  title: string;
  description: string;
  notification_date: string;
  notification_time: string;
  affected_persons: number;
  is_active: boolean;
  day?: string;
  month?: string;
  time?: string;
}

export default function SafetyNotifsStudent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<SafetyNotification[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Get current date for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('safety_notifications')
        .select('*')
        .eq('is_active', true)
        .order('notification_date', { ascending: true })
        .order('notification_time', { ascending: true });
      
      if (error) {
        console.error("Error fetching safety notifications:", error);
        return;
      }
      
      // Filter and format notifications
      const formattedNotifications = (data || []).map((notif: SafetyNotification) => {
        const date = new Date(notif.notification_date);
        return {
          ...notif,
          day: date.getDate().toString().padStart(2, '0'),
          month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
          time: formatTime(notif.notification_time)
        };
      });
      
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error("Error in fetchNotifications:", error);
    } finally {
      setLoading(false);
    }
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
    router.push('/');
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
              <BreadcrumbPage className="text-white">Safety Notifications</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <AccountCircle style={{ scale: "1.75", color: "white" }} />
      </SimpleGrid>

      <Group className={styles.bottom} style={{ position: "relative" }}>
        {loading ? (
          <Box style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px',
            width: '100%'
          }}>
            <Loader color="blue" />
          </Box>
        ) : notifications.length === 0 ? (
          <Text 
            style={{ 
              textAlign: 'center', 
              width: '100%', 
              padding: '2rem',
              color: '#555'
            }}
          >
            No current safety notifications to display.
          </Text>
        ) : (
          <Stack style={{ width: '100%' }}>
            {notifications.map((notif, index) => (
              <Box key={notif.id || index}>
                <Box style={{ 
                  width: "90vw", 
                  maxWidth: "600px", 
                  margin: "0 auto",
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  padding: "0.5rem 0"
                }}>
                  <Stack justify="flex-start" style={{ width: "10%", display: "flex", alignItems: "center" }} gap="0">
                    <Text style={{fontFamily: "monospace", fontSize: "1.5rem", fontWeight: "bold", color: "black"}}>
                      {notif.day}
                    </Text>
                    <Text style={{fontFamily: "monospace", fontSize: "0.7rem", color: "black"}}>
                      {notif.month}
                    </Text>
                  </Stack>
                  <Stack justify="flex-start" style={{ width: "67.5%", display: "flex", alignItems: "start", paddingLeft: "1rem" }} gap="0">
                    <Text style={{ fontSize: "1rem", fontWeight: "bold", color: "black"}}>
                      {notif.title}
                    </Text>
                    <Text style={{ fontSize: "0.75rem", color: "black"}}>
                      {notif.description}
                    </Text>
                    {/* Only show people count if greater than 0 */}
                    {notif.affected_persons > 0 && (
                      <Text style={{ fontSize: "0.7rem", color: "#888", marginTop: "4px" }}>
                        <GroupIcon style={{ fontSize: '0.85rem', marginRight: '2px' }} />
                        {`Expected attendance: ${notif.affected_persons} ${notif.affected_persons === 1 ? 'person' : 'people'}`}
                      </Text>
                    )}
                  </Stack>
                  <Box style={{ width: "22.5%", display: "flex", alignItems: "center", justifyContent: "flex-start", paddingRight: "1rem" }}>
                    <Schedule style={{ scale: "0.6", color: "black" }} />
                    <Text style={{fontFamily: "monospace", fontSize: "0.8rem", color: "black"}}>
                      {notif.time}
                    </Text>
                  </Box>
                </Box>
                <Divider my="sm" style={{marginBottom: "0rem", width: "90vw", maxWidth: "600px", margin: "0 auto"}} />
              </Box>
            ))}
          </Stack>
        )}
      </Group>
      
      <Box style={{ position: "fixed", bottom: 0, width: "100vw" }}>
        <Image src="../../images/vector.svg" radius="md" style={{ width: "100%", margin: 0 }} alt="" />
      </Box>
    </Stack>
  );
}
