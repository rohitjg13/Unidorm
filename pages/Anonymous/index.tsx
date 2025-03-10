import { Group, SimpleGrid, Stack, Button, Textarea, Box, Image, Text, Card, Loader, Modal, Badge, Alert } from "@mantine/core";
import styles from "../../styles/Template.module.css";
import React, { useEffect, useState } from "react";
import { ArrowBack, AccountCircle, History, WarningTwoTone } from "@material-ui/icons";
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
import { v4 as uuidv4 } from 'uuid';
import { ScrollArea } from "@mantine/core";

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
}

export default function AnonymousReporting() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [reportThreads, setReportThreads] = useState<ReportThread[]>([]);
  const [reportMessages, setReportMessages] = useState<Record<string, AnonymousReport[]>>({});
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [anonId, setAnonId] = useState<string>("");
  
  // Initialize or retrieve anonymous ID from localStorage
  useEffect(() => {
    let storedId = localStorage.getItem('anon_id');
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem('anon_id', storedId);
    }
    setAnonId(storedId);
  }, []);
  
  const goBack = () => {
    router.push('/');
  };
  
  // Submit new anonymous report
  const submitReport = async () => {
    if (!content.trim()) {
      alert("Please enter your report content.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // First create a new report thread
      const { data: threadData, error: threadError } = await supabase
        .from('anonymous_report_threads')
        .insert([{ 
          status: 'Pending',
          anon_id: anonId // Store the anonymous ID to link reports to the same "user"
        }])
        .select('id')
        .single();
      
      if (threadError) {
        console.error("Error creating report thread:", threadError);
        alert("Failed to submit report. Please try again.");
        return;
      }
      
      const threadId = threadData.id;
      
      // Then create the initial report message
      const { error: reportError } = await supabase
        .from('anonymous_reports')
        .insert([{
          report_id: threadId,
          content: content.trim(),
          is_admin_reply: false
        }]);
      
      if (reportError) {
        console.error("Error submitting report:", reportError);
        alert("Failed to submit report. Please try again.");
        return;
      }
      
      alert("Your report has been submitted anonymously.");
      setContent("");
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Fetch report threads for the current anonymous user
  const fetchReportHistory = async () => {
    if (!anonId) return;
    
    try {
      setLoadingHistory(true);
      
      // Fetch all report threads for this anonymous ID
      const { data: threads, error: threadsError } = await supabase
        .from('anonymous_report_threads')
        .select('*')
        .eq('anon_id', anonId)
        .order('created_at', { ascending: false });
      
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
      setShowHistory(true);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };
  
  // Submit reply to a thread
  const submitReply = async () => {
    if (!selectedThreadId || !replyContent.trim()) {
      alert("Please enter your reply.");
      return;
    }
    
    try {
      setSubmittingReply(true);
      
      const { error } = await supabase
        .from('anonymous_reports')
        .insert([{
          report_id: selectedThreadId,
          content: replyContent.trim(),
          is_admin_reply: false
        }]);
      
      if (error) {
        console.error("Error submitting reply:", error);
        alert("Failed to submit reply. Please try again.");
        return;
      }
      
      setReplyContent("");
      
      // Update the local state to show the new reply
      await fetchReportHistory();
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setSubmittingReply(false);
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
              <BreadcrumbPage className="text-white">Anonymous Reporting</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </SimpleGrid>

      <Group className={styles.bottom}>
        <ScrollArea style={{ height: 'calc(100vh - 70px)', width: '100%' }}>
          <Stack style={{ width: "80%", margin: "0 auto", padding: "1rem 0" }} gap="xl">
            {/* Add the warning alert above the card */}
            <Alert 
              icon={<WarningTwoTone />} 
              title="Important Privacy Notice" 
              color="orange"
              radius="md"
            >
              <Text size="sm" mb={5}>
                Your reports are only linked to this browser&apos;s local storage. For your privacy, we don&apos;t store any 
                identifiable information about you.
              </Text>
              <Text size="sm" fw={500}>
                Clearing browser data, using a different device, or clearing app cache will result in losing access 
                to your previous reports history.
              </Text>
            </Alert>

            <Card shadow="sm" p="md" radius="md" withBorder>
              <Text fw={600} mb="md">Submit an Anonymous Report</Text>
              <Text size="sm" c="dimmed" mb="md">
                Your report will be completely anonymous. No personally identifiable information will be stored.
                Please provide clear details to help us address your concerns.
              </Text>
                
              <Textarea
                placeholder="Describe the issue or concern you'd like to report anonymously..."
                autosize
                minRows={4}
                maxRows={6}
                style={{ marginBottom: '1rem' }}
                radius={10}
                value={content}
                onChange={(e) => setContent(e.currentTarget.value)}
                disabled={isSubmitting}
              />
              
              <Group justify="apart">
                <Button 
                  variant="outline" 
                  leftSection={<History />}
                  onClick={fetchReportHistory}
                  disabled={isSubmitting}
                >
                  View My Reports
                </Button>
                
                <Button 
                  variant="filled" 
                  color="blue" 
                  onClick={submitReport}
                  loading={isSubmitting}
                  disabled={isSubmitting || !content.trim()}
                >
                  Submit Anonymously
                </Button>
              </Group>
            </Card>
          </Stack>
        </ScrollArea>
      </Group>
      
      {/* Report History Modal */}
      <Modal
        opened={showHistory}
        onClose={() => setShowHistory(false)}
        title="Your Anonymous Reports"
        size="lg"
      >
        {/* Add the same warning in the modal as well */}
        <Alert 
          icon={<WarningTwoTone />} 
          title="Privacy Notice" 
          color="orange"
          radius="md"
          mb="md"
          styles={{
            message: { fontSize: '12px' }
          }}
        >
          Remember: Your reports are only accessible on this device. We do not store your identity to protect your privacy.
        </Alert>
        
        {loadingHistory ? (
          <Loader style={{ margin: "2rem auto", display: "block" }} />
        ) : reportThreads.length === 0 ? (
          <Text ta="center" py="xl">You haven&apos;t submitted any anonymous reports yet.</Text>
        ) : (
          <Stack gap="lg">
            {reportThreads.map(thread => (
              <Card key={thread.id} shadow="sm" p="md" radius="md" withBorder>
                <Stack>
                  <Group justify="apart">
                    <Text fw={600}>Report #{thread.id.substring(0, 8)}</Text>
                    <Badge color={getStatusColor(thread.status)}>{thread.status}</Badge>
                  </Group>
                  
                  <Text size="sm" c="dimmed">Submitted: {formatDate(thread.created_at)}</Text>
                  
                  <Card withBorder p="sm">
                    <Stack gap="md">
                      {reportMessages[thread.id]?.map((message, index) => (
                        <Group key={index} style={{ 
                          alignItems: 'flex-start',
                          justifyContent: message.is_admin_reply ? 'flex-start' : 'flex-end' 
                        }}>
                          <Card 
                            shadow="sm" 
                            p="xs" 
                            style={{ 
                              maxWidth: '80%',
                              backgroundColor: message.is_admin_reply ? '#f0f2f5' : '#e7f3ff'
                            }}
                          >
                            <Text size="xs" fw={500} mb="xs">
                              {message.is_admin_reply ? 'Admin' : 'You'} · {formatDate(message.created_at)}
                            </Text>
                            <Text size="sm">{message.content}</Text>
                          </Card>
                        </Group>
                      ))}
                    </Stack>
                  </Card>
                  
                  {thread.status !== 'Completed' && thread.status !== 'Rejected' && (
                    <Stack>
                      <Textarea
                        placeholder="Reply to this thread..."
                        value={selectedThreadId === thread.id ? replyContent : ''}
                        onChange={(e) => {
                          setSelectedThreadId(thread.id);
                          setReplyContent(e.currentTarget.value);
                        }}
                        autosize
                        minRows={2}
                        maxRows={4}
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedThreadId !== thread.id || !replyContent.trim() || submittingReply}
                        loading={selectedThreadId === thread.id && submittingReply}
                        onClick={submitReply}
                      >
                        Send Reply
                      </Button>
                    </Stack>
                  )}
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Modal>
      
      <Box style={{ position: "fixed", bottom: 0, width: "100vw", zIndex: 0 }}>
        <Image src="../../images/vector.svg" radius="md" style={{ width: "100%", margin: 0 }} alt=""/>
      </Box>
    </Stack>
  );
}
