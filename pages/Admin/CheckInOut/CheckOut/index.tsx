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
  LoadingOverlay
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
import { IconEye, IconCheck, IconX } from '@tabler/icons-react';
import withAdminAuth from "@/components/withAdminAuth"; // Import the HOC

type Checkout = {
  id: number;
  student_name: string;
  checkout_date: string;
  checkout_time: string;
  image_url: string;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
};

function AdminCheckOutPage() {
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('pending');
  const [loading, setLoading] = useState(true);
  const [imageModal, setImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  
  const router = useRouter();

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

  const updateCheckoutStatus = async (id: number, status: 'completed' | 'rejected') => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('checkouts')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      notifications.show({
        title: 'Success',
        message: `Checkout request ${status === 'completed' ? 'approved' : 'rejected'}`,
        color: status === 'completed' ? 'green' : 'red',
      });
      
      // Update local state
      setCheckouts(prevCheckouts => 
        prevCheckouts.map(checkout => 
          checkout.id === id ? { ...checkout, status } : checkout
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

  return (
    <Stack justify="flex-start" gap={0} className={styles.container}>
      <LoadingOverlay visible={loading} overlayBlur={2} />
      
      <SimpleGrid className={styles.header} cols={2}>
        <ArrowBack 
          style={{ scale: "1.75", color: "white", cursor: "pointer" }} 
          onClick={() => router.push('/Admin/Dashboard')}
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink style={{color: "#dedede"}} href="/Admin/Dashboard">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white" />
            <BreadcrumbItem>
              <BreadcrumbLink style={{color: "#dedede"}} href="/Admin/CheckInOut">Check In/Out</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white">Check Out Requests</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <AccountCircle style={{ scale: "1.75", color: "white" }} />
      </SimpleGrid>

      <Box className={styles.bottom} p="md">
        <Paper shadow="sm" p="md" withBorder style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="pending">Pending</Tabs.Tab>
              <Tabs.Tab value="completed">Completed</Tabs.Tab>
              <Tabs.Tab value="rejected">Rejected</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value={activeTab || 'pending'} pt="xs">
              {filteredCheckouts.length === 0 ? (
                <Text p="lg" ta="center">No {activeTab} checkout requests found.</Text>
              ) : (
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
                          {activeTab === 'pending' && (
                            <Group>
                              <Button 
                                size="xs" 
                                color="green"
                                leftSection={<IconCheck size="1rem" />}
                                onClick={() => updateCheckoutStatus(checkout.id, 'completed')}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="xs" 
                                color="red"
                                leftSection={<IconX size="1rem" />}
                                onClick={() => updateCheckoutStatus(checkout.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </Group>
                          )}
                          {activeTab !== 'pending' && (
                            <Text color={activeTab === 'completed' ? 'green' : 'red'}>
                              {activeTab === 'completed' ? 'Approved' : 'Rejected'}
                            </Text>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Box>

      <Modal 
        opened={imageModal} 
        onClose={() => setImageModal(false)}
        title="DigiCampus Screenshot"
        size="lg"
      >
        <Image
          src={selectedImage}
          fit="contain"
          height={500}
          alt="DigiCampus Screenshot"
        />
      </Modal>

      <Box className={styles.vectorBackground}>
        <Image src="../../../../images/vector.svg" radius="md" style={{ width: "100%", margin: 0 }} alt="" />
      </Box>
    </Stack>
  );
}

// Export the component wrapped with the admin authentication HOC
export default withAdminAuth(AdminCheckOutPage);