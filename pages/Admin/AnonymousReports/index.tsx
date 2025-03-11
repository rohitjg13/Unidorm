import { Group, SimpleGrid, Stack, Button, Text, Image, Box, Card, Badge, Select, Loader, Textarea } from "@mantine/core";
import styles from "../../../styles/Template.module.css";
import React, { useEffect, useState } from "react";
import { ArrowBack } from "@material-ui/icons";
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

// Define interface for anonymous reports
interface AnonymousReport {
  id: string;
  report_id: string;
  content: string;
  created_at: string;
  is_admin_reply: boolean;
}

// Define interface for report threads
interface ReportThread {
  id: string;
  status: "Pending" | "On Going" | "Completed" | "Rejected";
  created_at: string;
  updated_at: string;
  anon_id: string;
}

function AnonymousReportsAdmin() {
  const router = useRouter();
  const [reportThreads, setReportThreads] = useState<ReportThread[]>([]);
  const [reportMessages, setReportMessages] = useState<Record<string, AnonymousReport[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [replyContent, setReplyContent] = useState("");
  const [replyingToThread, setReplyingToThread] = useState<string | null>(null);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const goBack = () => {
    router.push('/Admin');
  };

  // Fetch all report threads
  const fetchReportThreads = async (status?: string) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('anonymous_report_threads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      
      const { data: threads, error: threadsError } = await query;
      
      if (threadsError) {
        console.error("Error fetching report threads:", threadsError);
        return;
      }
      
      setReportThreads(threads || []);
      
      // For each thread, fetch the messages
      const messagesMap: Record<string, AnonymousReport[]> = {};
      
      for (const thread of threads || []) {
        const { data: messages, error: messagesError } = await supabase
          .from('anonymous_reports')
          .select('*')
          .eq('report_id', thread.id)
          .order('created_at', { ascending: true });
        
        if (!messagesError && messages) {
          messagesMap[thread.id] = messages;
        }
      }
      
      setReportMessages(messagesMap);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === 'all') {
      fetchReportThreads();
    } else if (value === 'pending') {
      fetchReportThreads('Pending');
    } else if (value === 'ongoing') {
      fetchReportThreads('On Going');
    } else if (value === 'resolved') {
      fetchReportThreads('Completed');
    } else if (value === 'rejected') {
      fetchReportThreads('Rejected');
    }
  };
  
  // Submit admin reply
  const submitAdminReply = async (threadId: string) => {
    if (!replyContent.trim()) {
      alert("Please enter your reply.");
      return;
    }
    
    try {
      setSubmittingReply(true);
      setReplyingToThread(threadId);
      
      const { error } = await supabase
        .from('anonymous_reports')
        .insert([{
          report_id: threadId,
          content: replyContent.trim(),
          is_admin_reply: true
        }]);
      
      if (error) {
        console.error("Error submitting reply:", error);
        alert("Failed to submit reply. Please try again.");
        return;
      }
      
      // Just update the thread updated_at timestamp without changing status
      await supabase
        .from('anonymous_report_threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', threadId);
      
      // Refresh the messages for this thread
      const { data: messages, error: messagesError } = await supabase
        .from('anonymous_reports')
        .select('*')
        .eq('report_id', threadId)
        .order('created_at', { ascending: true });
      
      if (!messagesError && messages) {
        setReportMessages(prev => ({
          ...prev,
          [threadId]: messages
        }));
      }
      
      setReplyContent("");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSubmittingReply(false);
      setReplyingToThread(null);
    }
  };
  
  // Update thread status
  const updateThreadStatus = async (threadId: string, newStatus: "Pending" | "On Going" | "Completed" | "Rejected") => {
    try {
      setUpdatingStatus(threadId);
      
      const { error } = await supabase
        .from('anonymous_report_threads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', threadId);
      
      if (error) {
        console.error("Error updating status:", error);
        alert("Failed to update status. Please try again.");
        return;
      }
      
      // If we're changing to a status that should remove it from the current tab,
      // we need to refresh the whole list for the current tab
      handleTabChange(activeTab);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Rejected":
        return "red";
      case "On Going":
        return "blue";
      case "Completed":
        return "green";
      default:
        return "yellow"; // Pending
    }
  };
  
  useEffect(() => {
    fetchReportThreads('Pending');
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
              <BreadcrumbPage className="text-white">Anonymous Reports</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </SimpleGrid>

      <Group className={styles.bottom} style={{ position: 'relative', zIndex: 1 }}>
        <ScrollArea style={{ height: 'calc(100vh - 70px)', width: '100%', padding: '1rem' }}>
          <Stack style={{ width: '90%', maxWidth: '1000px', margin: '0 auto' }} gap="md">
            <Card shadow="sm" p="md" radius="md" withBorder>
              <Stack>
                <Text fw={700} size="lg">Anonymous Reports</Text>
                <Text size="sm" c="dimmed">Manage and respond to anonymous reports from students</Text>
              </Stack>
            </Card>

            <div>
              <div style={{ display: 'flex', borderBottom: '1px solid #e9ecef', marginBottom: '15px' }}>
                {['pending', 'ongoing', 'resolved', 'rejected', 'all'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    style={{
                      padding: '10px 15px',
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === tab ? '2px solid #228be6' : 'none',
                      color: activeTab === tab ? '#228be6' : 'inherit',
                      fontWeight: activeTab === tab ? 600 : 400,
                      cursor: 'pointer'
                    }}
                  >
                    {tab === 'pending' && 'Pending'}
                    {tab === 'ongoing' && 'In Progress'}
                    {tab === 'resolved' && 'Resolved'}
                    {tab === 'rejected' && 'Rejected'}
                    {tab === 'all' && 'All Reports'}
                  </button>
                ))}
              </div>

              <Box p="sm">
                {loading ? (
                  <Card shadow="sm" p="xl" radius="md" withBorder style={{ display: 'flex', justifyContent: 'center' }}>
                    <Loader color="blue" />
                  </Card>
                ) : reportThreads.length === 0 ? (
                  <Card shadow="sm" p="xl" radius="md" withBorder>
                    <Text ta="center">No reports found in this category.</Text>
                  </Card>
                ) : (
                  <Stack gap="lg">
                    {reportThreads.map(thread => (
                      <Card key={thread.id} shadow="sm" p="md" radius="md" withBorder>
                        <Stack>
                          <Group justify="apart">
                            <Group gap={6}>
                              <Text fw={600}>Report #{thread.id.substring(0, 8)}</Text>
                              <Text size="xs" c="dimmed">#{thread.anon_id.substring(0, 6)}</Text>
                            </Group>
                            <Group gap={6}>
                              <Badge color={getStatusColor(thread.status)}>
                                {thread.status}
                              </Badge>
                            </Group>
                          </Group>
                          
                          <Group gap={6}>
                            <Text size="xs" fw={500}>Created:</Text>
                            <Text size="xs" c="dimmed">{formatDate(thread.created_at)}</Text>
                            {thread.created_at !== thread.updated_at && (
                              <>
                                <Text size="xs" fw={500}>Updated:</Text>
                                <Text size="xs" c="dimmed">{formatDate(thread.updated_at)}</Text>
                              </>
                            )}
                          </Group>
                          
                          <Card withBorder padding="sm">
                            <Stack gap="md">
                              {reportMessages[thread.id]?.map((message, index) => (
                                <Group key={index} style={{ 
                                  alignItems: 'flex-start',
                                  justifyContent: message.is_admin_reply ? 'flex-end' : 'flex-start' 
                                }}>
                                  <Card 
                                    shadow="sm" 
                                    p="xs" 
                                    style={{ 
                                      maxWidth: '80%',
                                      backgroundColor: message.is_admin_reply ? '#e7f3ff' : '#f0f2f5'
                                    }}
                                  >
                                    <Text size="xs" fw={500} mb="xs">
                                      {message.is_admin_reply ? 'Admin Reply' : 'Anonymous Reporter'} · {formatDate(message.created_at)}
                                    </Text>
                                    <Text size="sm">{message.content}</Text>
                                  </Card>
                                </Group>
                              ))}
                            </Stack>
                          </Card>
                          
                          {/* Status Update Buttons - Clear separation from replying */}
                          <Group justify="center">
                            <Button
                              size="xs"
                              variant={thread.status === "Pending" ? "filled" : "outline"}
                              color="yellow"
                              onClick={() => updateThreadStatus(thread.id, "Pending")}
                              disabled={thread.status === "Pending" || !!updatingStatus}
                              loading={updatingStatus === thread.id}
                            >
                              Pending
                            </Button>
                            <Button
                              size="xs"
                              variant={thread.status === "On Going" ? "filled" : "outline"}
                              color="blue"
                              onClick={() => updateThreadStatus(thread.id, "On Going")}
                              disabled={thread.status === "On Going" || !!updatingStatus}
                              loading={updatingStatus === thread.id}
                            >
                              In Progress
                            </Button>
                            <Button
                              size="xs"
                              variant={thread.status === "Completed" ? "filled" : "outline"}
                              color="green"
                              onClick={() => updateThreadStatus(thread.id, "Completed")}
                              disabled={thread.status === "Completed" || !!updatingStatus}
                              loading={updatingStatus === thread.id}
                            >
                              Resolved
                            </Button>
                            <Button
                              size="xs"
                              variant={thread.status === "Rejected" ? "filled" : "outline"}
                              color="red"
                              onClick={() => updateThreadStatus(thread.id, "Rejected")}
                              disabled={thread.status === "Rejected" || !!updatingStatus}
                              loading={updatingStatus === thread.id}
                            >
                              Rejected
                            </Button>
                          </Group>
                          
                          {/* Reply section - only show for non-completed/rejected threads */}
                          {thread.status !== 'Completed' && thread.status !== 'Rejected' && (
                            <Stack mt="md">
                              <Textarea
                                placeholder="Reply to this anonymous report..."
                                value={replyingToThread === thread.id ? replyContent : ''}
                                onChange={(e) => {
                                  setReplyingToThread(thread.id);
                                  setReplyContent(e.currentTarget.value);
                                }}
                                autosize
                                minRows={2}
                                maxRows={4}
                                disabled={submittingReply && replyingToThread === thread.id}
                              />
                              
                              <Group justify="right">
                                <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                                  Replying does not change the status automatically
                                </Text>
                                <Button
                                  variant="filled"
                                  color="blue"
                                  size="sm"
                                  disabled={replyingToThread !== thread.id || !replyContent.trim() || submittingReply}
                                  loading={replyingToThread === thread.id && submittingReply}
                                  onClick={() => submitAdminReply(thread.id)}
                                >
                                  Send Admin Reply
                                </Button>
                              </Group>
                            </Stack>
                          )}
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            </div>
          </Stack>
        </ScrollArea>
      </Group>
      
      <Box style={{ position: "fixed", bottom: 0, width: "100vw", zIndex: 0 }}>
        <Image src="../../../images/vector.svg" radius="md" style={{ width: "100%", margin: 0 }} alt="" />
      </Box>
    </Stack>
  );
}

export default withAdminAuth(AnonymousReportsAdmin);