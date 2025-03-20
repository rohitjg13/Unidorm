import { useEffect, useState } from "react";
import { 
  Stack, 
  SimpleGrid, 
  Box, 
  Tabs, 
  Table, 
  Paper, 
  Text, 
  Button, 
  Group, 
  Image, 
  Modal, 
  ActionIcon,
  LoadingOverlay,
  ScrollArea
} from "@mantine/core";
import { ArrowBack, AccountCircle } from "@material-ui/icons";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import styles from "../../../../styles/Template.module.css";
import supabase from '../../../utils/supabase/client';
import { useRouter } from 'next/router';
import { notifications } from '@mantine/notifications';
import { IconEye, IconCheck } from '@tabler/icons-react';
import withAdminAuth from "@/components/withAdminAuth";
import { useMediaQuery } from '@mantine/hooks';

type Checkout = {
  id: number;
  student_name: string;
  checkout_date: string;
  checkout_time: string;
  image_url: string;
  status: 'pending' | 'completed';
  created_at: string;
};

function AdminCheckOutPage() {
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('pending');
  const [loading, setLoading] = useState(true);
  const [imageModal, setImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    fetchCheckouts();
  }, []);

  const fetchCheckouts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('checkouts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setCheckouts(data || []);
    } catch (error) {
      console.error('Error fetching checkouts:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load checkout data',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCheckoutStatus = async (id: number) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('checkouts')
        .update({ status: 'completed' })
        .eq('id', id);
      
      if (error) throw error;
      
      notifications.show({
        title: 'Success',
        message: 'Checkout request noted',
        color: 'green',
      });
      
      // Update local state
      setCheckouts(prevCheckouts => 
        prevCheckouts.map(checkout => 
          checkout.id === id ? { ...checkout, status: 'completed' } : checkout
        )
      );
    } catch (error) {
      console.error('Error updating checkout status:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update checkout status',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModal(true);
  };

  // Filter checkouts based on active tab
  const filteredCheckouts = checkouts.filter(checkout => checkout.status === activeTab);

  // Mobile card view for checkout requests
  const renderMobileCheckoutCard = (checkout: Checkout) => (
    <Paper shadow="xs" p="md" withBorder radius="md" mb="md" key={checkout.id}>
      <Stack gap="xs">
        <Group justify="apart">
          <Text fw={600}>{checkout.student_name}</Text>
          {activeTab === 'completed' && (
            <Text color="green" size="sm">Noted</Text>
          )}
        </Group>
        
        <Group justify="apart">
          <Text size="sm">Date: {new Date(checkout.checkout_date).toLocaleDateString()}</Text>
          <Text size="sm">Time: {checkout.checkout_time}</Text>
        </Group>
        
        <Group justify="apart" mt="xs">
          <ActionIcon 
            color="blue" 
            variant="light" 
            onClick={() => openImageModal(checkout.image_url)}
          >
            <IconEye size="1.25rem" />
          </ActionIcon>
          
          {activeTab === 'pending' && (
            <Button 
              size="xs" 
              color="green"
              leftSection={<IconCheck size="1rem" />}
              onClick={() => updateCheckoutStatus(checkout.id)}
            >
              Noted
            </Button>
          )}
        </Group>
      </Stack>
    </Paper>
  );

  return (
    <Stack justify="flex-start" gap={0} className={styles.container}>
      <LoadingOverlay visible={loading} />
      
      <SimpleGrid className={styles.header} cols={2}>
        <ArrowBack 
          style={{ scale: "1.75", color: "white", cursor: "pointer" }} 
          onClick={() => router.push('/Admin/Dashboard')}
        />
        <Breadcrumb>
          <BreadcrumbList>
            {!isMobile ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink style={{color: "#dedede"}} href="/Admin/Dashboard">Admin</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-white" />
                <BreadcrumbItem>
                  <BreadcrumbLink style={{color: "#dedede"}} href="/Admin/CheckInOut">Check In/Out</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-white" />
              </>
            ) : null}
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white">Check Out</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <AccountCircle style={{ scale: "1.75", color: "white" }} />
      </SimpleGrid>

      <Box className={styles.bottom} p="md">
        <Paper shadow="sm" p="md" withBorder style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List grow={isMobile}>
              <Tabs.Tab value="pending">Pending</Tabs.Tab>
              <Tabs.Tab value="completed">Completed</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value={activeTab || 'pending'} pt="xs">
              {filteredCheckouts.length === 0 ? (
                <Text p="lg" ta="center">No {activeTab} checkout requests found.</Text>
              ) : isMobile ? (
                <Stack gap="md" mt="md">
                  {filteredCheckouts.map(renderMobileCheckoutCard)}
                </Stack>
              ) : (
                <ScrollArea>
                  <Table striped>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Student Name</Table.Th>
                        <Table.Th>Date</Table.Th>
                        <Table.Th>Time</Table.Th>
                        <Table.Th>DigiCampus</Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredCheckouts.map((checkout) => (
                        <Table.Tr key={checkout.id}>
                          <Table.Td>{checkout.student_name}</Table.Td>
                          <Table.Td>{new Date(checkout.checkout_date).toLocaleDateString()}</Table.Td>
                          <Table.Td>{checkout.checkout_time}</Table.Td>
                          <Table.Td>
                            <ActionIcon onClick={() => openImageModal(checkout.image_url)}>
                              <IconEye size="1.25rem" />
                            </ActionIcon>
                          </Table.Td>
                          <Table.Td>
                            {activeTab === 'pending' ? (
                              <Button 
                                size="xs" 
                                color="green"
                                leftSection={<IconCheck size="1rem" />}
                                onClick={() => updateCheckoutStatus(checkout.id)}
                              >
                                Noted
                              </Button>
                            ) : (
                              <Text color="green">Noted</Text>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              )}
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Box>

      <Modal 
        opened={imageModal} 
        onClose={() => setImageModal(false)}
        title="DigiCampus Screenshot"
        size={isMobile ? "sm" : "lg"}
        centered
      >
        <Image
          src={selectedImage}
          fit="contain"
          height={isMobile ? 300 : 500}
          alt="DigiCampus Screenshot"
        />
      </Modal>

      <Box className={styles.vectorBackground}>
        <Image src="../../../../images/vector.svg" radius="md" style={{ width: "100%", margin: 0 }} alt="" />
      </Box>
    </Stack>
  );
}

export default withAdminAuth(AdminCheckOutPage);