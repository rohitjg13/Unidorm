import { Group, SimpleGrid, Stack, UnstyledButton, Text, Box, Image } from "@mantine/core";
import styles from "../../styles/Template.module.css";
import React, { useEffect, useState } from "react";
import { 
  Build, 
  Person, 
  Announcement, 
  Report, 
  ExitToApp, 
  Forum,
  ArrowBack, 
  AccountCircle 
} from "@material-ui/icons";
import { useRouter } from "next/router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import withAdminAuth from '@/components/withAdminAuth';

function AdminPage() {
  const router = useRouter();
  const [date, setDate] = useState("");

  useEffect(() => {
    const date_obj = new Date();
    const day = date_obj.getDate();
    const month = date_obj.getMonth() + 1;
    const year = date_obj.getFullYear();
    setDate(`${day}/${month}/${year}`);
  }, []);

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
              <BreadcrumbPage className="text-white">Admin Portal</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </SimpleGrid>

      <Group className={styles.bottom} style={{ 
        position: 'relative', 
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 60px)', // Adjust based on your header height
        justifyContent: 'center',
        paddingBottom: '40px' // Add space at bottom to account for the vector image
      }}>
        <SimpleGrid 
          cols={{ base: 2, sm: 2, lg: 3 }} 
          style={{ 
            width: "90%", 
            margin: "0 auto", 
            display: 'grid',
            alignContent: 'center'
          }} 
          spacing="xl" // Increased spacing
          verticalSpacing="xl" // Explicitly set vertical spacing
        >
          <UnstyledButton 
            className={styles.button} 
            onClick={() => router.push("/Admin/MaintenanceRequests")}
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '1rem',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              height: '120px', // Set a consistent height
              justifyContent: 'center'
            }}
          >
            <Build style={{ scale: "1.5", color: "#3f6cd4" }} />
            <Text style={{ fontWeight: 600, textAlign: 'center', fontSize: '14px' }}>Maintenance Requests</Text>
          </UnstyledButton>

          <UnstyledButton 
            className={styles.button} 
            onClick={() => router.push("/Admin/WorkerDetails")}
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '1rem',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              height: '120px', // Set a consistent height
              justifyContent: 'center'
            }}
          >
            <Person style={{ scale: "1.5", color: "#3f6cd4" }} />
            <Text style={{ fontWeight: 600, textAlign: 'center', fontSize: '14px' }}>Worker Details</Text>
          </UnstyledButton>
          
          <UnstyledButton 
            className={styles.button} 
            onClick={() => router.push("/Admin/MakeAnnouncement")}
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '1rem',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              height: '120px', // Set a consistent height
              justifyContent: 'center'
            }}
          >
            <Announcement style={{ scale: "1.5", color: "#3f6cd4" }} />
            <Text style={{ fontWeight: 600, textAlign: 'center', fontSize: '14px' }}>Make Announcement</Text>
          </UnstyledButton>
          
          <UnstyledButton 
            className={styles.button} 
            onClick={() => router.push("/Admin/AnonymousReports")}
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '1rem',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              height: '120px', // Set a consistent height
              justifyContent: 'center'
            }}
          >
            <Report style={{ scale: "1.5", color: "#3f6cd4" }} />
            <Text style={{ fontWeight: 600, textAlign: 'center', fontSize: '14px' }}>Anonymous Reports</Text>
          </UnstyledButton>
          
          <UnstyledButton 
            className={styles.button}
            onClick={() => router.push("/Admin/CheckInOut")}
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '1rem',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              height: '120px', // Set a consistent height
              justifyContent: 'center'
            }}
          >
            <ExitToApp style={{ scale: "1.5", color: "#3f6cd4" }} />
            <Text style={{ fontWeight: 600, textAlign: 'center', fontSize: '14px' }}>Check In/Out Requests</Text>
          </UnstyledButton>
          
          <UnstyledButton 
            className={styles.button}
            onClick={() => router.push("/Admin/Forums")}
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '1rem',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              height: '120px', // Set a consistent height
              justifyContent: 'center'
            }}
          >
            <Forum style={{ scale: "1.5", color: "#3f6cd4" }} />
            <Text style={{ fontWeight: 600, textAlign: 'center', fontSize: '14px' }}>Open Forums</Text>
          </UnstyledButton>
        </SimpleGrid>
      </Group>
      
      {/* Bottom vector image from Maintenance page */}
      <Box style={{ position: "fixed", bottom: 0, width: "100vw", zIndex: 0 }}>
        <Image src="../../images/vector.svg" radius="md" style={{ width: "100%", margin: 0 }} alt=""/>
      </Box>
    </Stack>
  );
}

export default withAdminAuth(AdminPage);