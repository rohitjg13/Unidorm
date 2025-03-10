import { useRouter } from "next/router";
import React, { useState, useEffect, useRef } from "react";
import { Card, Text, Group, Stack, Button, Image, Divider, SimpleGrid, ScrollArea, Modal, Textarea } from "@mantine/core";
import { 
  IconArrowLeft, 
  IconUser, 
  IconArrowUp, 
  IconArrowDown, 
  IconSend,
  IconChevronDown,
  IconChevronRight,
  IconMaximize,
  IconMinimize
} from '@tabler/icons-react';
import styles from "../../styles/Template.module.css";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import supabase from "@/utils/supabase/client";

const bottomStyles = {
  backgroundColor: '#fff',
  minHeight: '95vh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column' as 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  paddingTop: '0rem',
  fontSize: 'calc(10px + 2vmin)',
  color: '#3f6cd4',
  position: 'relative' as 'relative',
  top: 0,
  bottom: 0,
  margin: 0,
  boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)',
};

// Update Reply interface to support parent_id for nested replies
interface Reply {
  id: string;
  post_id: string;
  content: string;
  user_id: string;
  username: string;
  created_at: string;
  parent_id?: string;  // ID of the parent reply (if this is a nested reply)
  replies?: Reply[];   // Nested replies
}

export default function PostDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [post, setPost] = useState<{ id: string; title: string; content: string; created_at: string; username: string; image?: string; upvotes: number; downvotes: number } | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; user_metadata?: { name?: string } } | null>(null);
  const [newReply, setNewReply] = useState("");
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [submittingNestedReply, setSubmittingNestedReply] = useState<Record<string, boolean>>({});
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          setUser({
            id: currentUser.id,
            email: currentUser.email || '',
            user_metadata: currentUser.user_metadata,
          });
        } else {
          setUser(null);
        }
        
        if (currentUser && id) {
          // Fetch user's vote for this post
          const { data: voteData } = await supabase
            .from('forum_post_votes')
            .select('vote_type')
            .eq('post_id', id)
            .eq('user_id', currentUser.id)
            .single();
            
          if (voteData) {
            setUserVote(voteData.vote_type);
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      }
    };
    
    if (id) {
      checkAuth();
    }
  }, [id]);

  // Fetch post and replies
  useEffect(() => {
    const fetchPostAndReplies = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch the post
        const { data: postData, error: postError } = await supabase
          .from('forum_posts')
          .select('*')
          .eq('id', id)
          .single();
          
        if (postError) {
          console.error('Error fetching post:', postError);
          return;
        }
        
        setPost(postData);
        
        // Fetch replies
        const { data: repliesData, error: repliesError } = await supabase
          .from('forum_replies')
          .select('*')
          .eq('post_id', id)
          .order('created_at', { ascending: true });
          
        if (repliesError) {
          console.error('Error fetching replies:', repliesError);
          return;
        }
        
        setReplies(repliesData || []);
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPostAndReplies();
  }, [id]);

  // Make sure the organizeReplies function is called when replies change
  useEffect(() => {
    // When replies state updates, this will run
    console.log('Replies updated, total count:', replies.length);
  }, [replies]);

  // Go back to forums page
  const goBack = () => {
    router.push('/Forums');
  };

  // Check if user is logged in, show login modal if not
  const checkAuth = () => {
    if (!user) {
      setLoginModalOpen(true);
      return false;
    }
    return true;
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/Forums/${id}`
        }
      });
      
      if (error) {
        console.error('Error signing in with Google:', error);
      }
    } catch (error) {
      console.error('Error during Google sign-in:', error);
    }
  };

  // Handle voting
interface VoteData {
    post_id: string;
    user_id: string;
    vote_type: 'up' | 'down';
}

const handleVote = async (voteType: 'up' | 'down') => {
    try {
        if (!checkAuth()) return;
        if (!post) return;
        
        const updatedVotes = { ...post };
        
        // If user already voted the same way, remove the vote
        if (userVote === voteType) {
            if (voteType === 'up') {
                updatedVotes.upvotes = Math.max(0, post.upvotes - 1);
            } else {
                updatedVotes.downvotes = Math.max(0, post.downvotes - 1);
            }
            
            // Remove vote from database
            const { error: deleteError } = await supabase
                .from('forum_post_votes')
                .delete()
                .eq('post_id', id as string)
                .eq('user_id', user?.id);
                
            if (deleteError) {
                console.error('Error removing vote:', deleteError);
                return;
            }
            
            setUserVote(null);
        } 
        else {
            // User is either voting for the first time or changing vote
            if (userVote) {
                // Changing vote
                if (userVote === 'up') {
                    // From upvote to downvote
                    updatedVotes.upvotes = Math.max(0, post.upvotes - 1);
                    updatedVotes.downvotes = post.downvotes + 1;
                } else {
                    // From downvote to upvote
                    updatedVotes.upvotes = post.upvotes + 1;
                    updatedVotes.downvotes = Math.max(0, post.downvotes - 1);
                }
                
                // Update vote type
                const { error: updateError } = await supabase
                    .from('forum_post_votes')
                    .update({ vote_type: voteType })
                    .eq('post_id', id as string)
                    .eq('user_id', user?.id);
                    
                if (updateError) {
                    console.error('Error updating vote:', updateError);
                    return;
                }
            } 
            else {
                // First time voting
                if (voteType === 'up') {
                    updatedVotes.upvotes = post.upvotes + 1;
                } else {
                    updatedVotes.downvotes = post.downvotes + 1;
                }
                
                // Insert new vote
                const { error: insertError } = await supabase
                    .from('forum_post_votes')
                    .insert({ 
                        post_id: id as string, 
                        user_id: user?.id, 
                        vote_type: voteType 
                    } as VoteData);
                    
                if (insertError) {
                    console.error('Error inserting vote:', insertError);
                    return;
                }
            }
            
            setUserVote(voteType);
        }
        
        // Update post in database
        const voteData: { upvotes: number; downvotes: number } = {
            upvotes: updatedVotes.upvotes,
            downvotes: updatedVotes.downvotes
        };
        
        const { error } = await supabase
            .from('forum_posts')
            .update(voteData)
            .eq('id', id as string);
            
        if (error) {
            console.error('Error updating post votes:', error);
            return;
        }
        
        // Update local state
        setPost(updatedVotes);
        
    } catch (error) {
        console.error('Unexpected error during voting:', error);
    }
};

  // Handle reply submission
  const handleSubmitReply = async () => {
    try {
      if (!checkAuth()) return;
      if (!newReply.trim()) return;
      
      setSubmittingReply(true);
      
      // Create reply object
      const replyData = {
        post_id: id,
        content: newReply,
        user_id: user?.id,
        username: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Anonymous'
      };
      
      // Insert reply
      const { data, error } = await supabase
        .from('forum_replies')
        .insert([replyData])
        .select();
        
      if (error) {
        console.error('Error creating reply:', error);
        return;
      }
      
      // Update local state
      setReplies([...replies, data[0]]);
      setNewReply("");
      
      // Update post reply count - this will happen automatically if you set up the trigger in Supabase
      
    } catch (error) {
      console.error('Unexpected error during reply submission:', error);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Handle nested reply submission
const handleSubmitNestedReply = async (parentId: string) => {
  try {
    if (!checkAuth()) return;
    
    const content = replyText[parentId];
    if (!content || !content.trim()) return;
    
    setSubmittingNestedReply(prev => ({ ...prev, [parentId]: true }));
    
    // Create nested reply object
    const replyData = {
      post_id: id,
      content: content,
      user_id: user?.id,
      username: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Anonymous',
      parent_id: parentId
    };
    
    // Insert nested reply
    const { data, error } = await supabase
      .from('forum_replies')
      .insert([replyData])
      .select();
      
    if (error) {
      console.error('Error creating nested reply:', error);
      return;
    }
    
    // Update local state with the new nested reply
    setReplies(current => {
      const updatedReplies = [...current];
      // Add the new reply to the list
      updatedReplies.push(data[0]);
      return updatedReplies;
    });
    
    // Clear reply text and close the reply form
    setReplyText(prev => ({ ...prev, [parentId]: '' }));
    setReplyingTo(null);
    
  } catch (error) {
    console.error('Unexpected error during nested reply submission:', error);
  } finally {
    setSubmittingNestedReply(prev => ({ ...prev, [parentId]: false }));
  }
};

// Function to organize replies into a hierarchical structure
const organizeReplies = (allReplies: Reply[]): Reply[] => {
  const topLevelReplies: Reply[] = [];
  const replyMap: Record<string, Reply> = {};
  
  // First pass: create a map of all replies and identify top-level replies
  allReplies.forEach(reply => {
    // Create a copy with empty replies array
    const replyWithChildren = { ...reply, replies: [] };
    replyMap[reply.id] = replyWithChildren;
    
    if (!reply.parent_id) {
      topLevelReplies.push(replyWithChildren);
    }
  });
  
  // Second pass: build the hierarchy
  allReplies.forEach(reply => {
    if (reply.parent_id && replyMap[reply.parent_id]) {
      replyMap[reply.parent_id].replies!.push(replyMap[reply.id]);
    }
  });
  
  return topLevelReplies;
};

// Add a memo for organized replies
const organizedReplies = React.useMemo(() => {
  return organizeReplies(replies);
}, [replies]);

// Update the ReplyCard component with a working handleLocalReply function
const ReplyCard = ({ reply, depth = 0, parentExpanded = true }: { 
  reply: Reply; 
  depth?: number;
  parentExpanded?: boolean;
}) => {
  const [localReplyText, setLocalReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(depth > 1);
  
  const hasReplies = reply.replies && reply.replies.length > 0;

  const handleLocalReply = async () => {
    try {
      if (!checkAuth()) return;
      
      if (!localReplyText.trim()) return;
      
      setIsSubmitting(true);
      
      // Create nested reply object
      const replyData = {
        post_id: id as string, // Make sure to cast id to string
        content: localReplyText,
        user_id: user?.id,
        username: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Anonymous',
        parent_id: reply.id // This links to the parent reply
      };
      
      // Insert nested reply
      const { data, error } = await supabase
        .from('forum_replies')
        .insert([replyData])
        .select();
        
      if (error) {
        console.error('Error creating nested reply:', error);
        return;
      }
      
      // Add the new reply to the main replies list
      if (data && data.length > 0) {
        // Update the replies state
        setReplies(currentReplies => [...currentReplies, data[0]]);
        
        // This will cause the organizeReplies function to run again
        // when the component re-renders, rebuilding the hierarchy
        console.log('Added new nested reply:', data[0]);
      }
      
      // Clear reply text and close the reply form
      setLocalReplyText('');
      setIsReplying(false);
      
    } catch (error) {
      console.error('Unexpected error during nested reply submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Optimize indentation - make it narrower to reduce empty space
  const indentWidth = depth > 0 ? 
    `${Math.min(24, depth * 12)}px` : 
    '0px';

  // If parent is not expanded, don't render this reply
  if (!parentExpanded) return null;

  return (
    <div style={{ 
      marginBottom: depth === 0 ? "12px" : "6px", // Less spacing between nested replies
      display: 'flex',
      width: '100%'
    }}>
      {/* Vertical threading line - thinner and more subtle */}
      {depth > 0 && (
        <div style={{
          width: indentWidth,
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            left: '0',
            top: '0',
            bottom: '0',
            width: '2px',
            backgroundColor: '#e0e0e0',
            marginLeft: depth > 1 ? `${Math.min(12, (depth-1) * 12)}px` : '0px'
          }} />
        </div>
      )}

      {/* Comment content - more compact for nested replies */}
      <div style={{ 
        flexGrow: 1,
        backgroundColor: '#ffffff', 
        borderRadius: depth > 0 ? '4px' : '6px', // Smaller radii
        padding: depth > 0 ? '8px 12px' : '12px 16px',
        border: depth > 0 ? '1px solid #f0f0f0' : '1px solid #eeeeee',
        boxShadow: depth === 0 ? '0px 2px 4px rgba(0,0,0,0.05)' : 'none',
        marginLeft: '4px', // Small gap between threading line and content
      }}>
        {/* User info and timestamp - more compact for nested replies */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: depth > 0 ? '4px' : '8px' // Less margin for nested
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Collapse toggle button */}
            {hasReplies && (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(!isCollapsed);
                }}
                style={{
                  cursor: 'pointer',
                  marginRight: '6px', // Reduced margin
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px', // Smaller padding
                  borderRadius: '50%',
                }}
                title={isCollapsed ? "Expand replies" : "Collapse replies"}
              >
                {isCollapsed ? 
                  <IconChevronRight size={16} style={{ color: '#666' }} /> : 
                  <IconChevronDown size={16} style={{ color: '#666' }} />
                }
              </div>
            )}
            <IconUser style={{ 
              color: '#3f6cd4', 
              width: '16px',
              height: '16px',
              marginRight: '4px' // Reduced margin
            }} />
            <div>
              <Text fw={600} size={depth > 0 ? "xs" : "sm"} style={{ lineHeight: 1.2 }}>
                {reply.username || "Anonymous"}
              </Text>
              <Text size="xs" color="dimmed">
                {formatDate(reply.created_at)}
              </Text>
            </div>
          </div>
          
          {/* Reply count - smaller for nested replies */}
          {hasReplies && (
            <Text size="xs" color="dimmed" style={{ fontSize: depth > 0 ? '11px' : '12px' }}>
              {reply.replies?.length} {reply.replies?.length === 1 ? 'reply' : 'replies'}
            </Text>
          )}
        </div>
        
        {/* Comment content - font size based on depth */}
        <Text size={depth > 0 ? "xs" : "sm"} style={{ 
          lineHeight: depth > 0 ? 1.5 : 1.6,
          marginBottom: depth > 0 ? '6px' : '10px',
          color: '#333333'
        }}>
          {reply.content}
        </Text>
        
        {/* Action buttons row - more compact */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Reply button */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {user && (
              <Button
                variant="subtle"
                size={depth > 0 ? "xs" : "sm"}
                style={{
                  padding: depth > 0 ? '0 8px' : undefined,
                  height: depth > 0 ? '24px' : undefined,
                  minHeight: depth > 0 ? '24px' : undefined,
                  fontSize: depth > 0 ? '12px' : undefined
                }}
                onClick={() => setIsReplying(!isReplying)}
              >
                {isReplying ? "Cancel" : "Reply"}
              </Button>
            )}
          </div>
        </div>
        
        {/* Reply form - more compact for nested replies */}
        {isReplying && (
          <div style={{ 
            marginTop: depth > 0 ? '8px' : '12px',
            padding: depth > 0 ? '6px' : '8px',
            backgroundColor: '#f9f9f9',
            borderRadius: '6px'
          }}>
            <Textarea
              placeholder="Write your reply..."
              minRows={2}
              autosize
              maxRows={depth > 0 ? 4 : 6}
              value={localReplyText}
              onChange={(e) => setLocalReplyText(e.currentTarget.value)}
              autoFocus
              style={{ 
                marginBottom: depth > 0 ? '6px' : '8px', 
                fontSize: depth > 0 ? '13px' : '14px' 
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                size={depth > 0 ? "xs" : "sm"}
                style={{
                  padding: depth > 0 ? '0 8px' : undefined,
                  height: depth > 0 ? '24px' : undefined,
                  minHeight: depth > 0 ? '24px' : undefined,
                  fontSize: depth > 0 ? '12px' : undefined
                }}
                leftSection={<IconSend size={depth > 0 ? 14 : 16} />}
                onClick={handleLocalReply}
                loading={isSubmitting}
                disabled={!localReplyText.trim()}
               
              >
                Reply
              </Button>
            </div>
          </div>
        )}
        
        {/* Nested replies - only show direct children, keep their nested replies collapsed */}
        {!isCollapsed && hasReplies && (
          <div style={{ 
            marginTop: depth > 0 ? '6px' : '10px',
            marginLeft: depth > 0 ? '-2px' : '0' // Pull nested replies slightly to the left to reduce empty space
          }}>
            {reply.replies?.map(nestedReply => (
              <ReplyCard 
                key={nestedReply.id} 
                reply={nestedReply} 
                depth={depth + 1} 
                parentExpanded={true}
              />
            ))}
          </div>
        )}
        
        {/* Collapsed indicator - show when collapsed and has replies */}
        {isCollapsed && hasReplies && (
          <div 
            style={{ 
              marginTop: '6px',
              padding: '6px', 
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: depth > 0 ? '11px' : '12px'
            }}
            onClick={() => setIsCollapsed(false)}
          >
            <Text size="xs" color="dimmed">
              {reply.replies?.length} hidden {reply.replies?.length === 1 ? 'reply' : 'replies'} - Click to expand
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

  // Format date
const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "Recently";
    return new Date(dateString).toLocaleString();
};

  if (loading) {
    return (
      <Stack justify="flex-start" gap={0} className={styles.container}>
        <SimpleGrid className={styles.header} cols={2}>
          <IconArrowLeft 
            style={{ scale: "1.75", color: "white", cursor: "pointer" }} 
            onClick={goBack}
          />
          <div />
          <div />
        </SimpleGrid>
        <Group style={bottomStyles}>
          <Text ta="center" py="xl" size="lg">Loading post...</Text>
        </Group>
      </Stack>
    );
  }

  if (!post) {
    return (
      <Stack justify="flex-start" gap={0} className={styles.container}>
        <SimpleGrid className={styles.header} cols={2}>
          <IconArrowLeft 
            style={{ scale: "1.75", color: "white", cursor: "pointer" }} 
            onClick={goBack}
          />
          <div />
          <div />
        </SimpleGrid>
        <Group style={bottomStyles}>
          <Text ta="center" py="xl" size="lg">Post not found</Text>
          <Button onClick={goBack}>Return to Forums</Button>
        </Group>
      </Stack>
    );
  }

  return (
    <Stack justify="flex-start" gap={0} className={styles.container}>
      <SimpleGrid className={styles.header} cols={2}>
        <IconArrowLeft 
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
              <BreadcrumbLink style={{color: "#dedede"}} href="/Forums">Forums</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white">Post</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {user ? (
          <Group justify="right">
            <Text color="white" size="sm">{user.user_metadata?.name || user.email?.split('@')[0]}</Text>
            <IconUser style={{ scale: "1.75", color: "white" }} />
          </Group>
        ) : (
          <Button 
            variant="subtle" 
            color="white"
            onClick={() => setLoginModalOpen(true)}
          >
            <IconUser style={{ scale: "1.75", color: "white" }} />
          </Button>
        )}
      </SimpleGrid>
      
      <div style={{ ...bottomStyles, position: 'relative', padding: '0', width: '100%' }}>
        <ScrollArea
          style={{ height: "calc(100vh - 70px)", width: "100%" }}
          scrollbarSize={8}
          type="hover"
        >
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            padding: '1rem',
            width: '100%'
          }}>
            <Stack gap="md" style={{ width: '100%' }}>
              {/* Post header section - more mobile friendly */}
              <Card 
                shadow="sm" 
                padding="md" // Fixed padding
                radius="sm" // Changed from "md" to "sm"
                withBorder
              >
                <Stack gap="md">
                  <Group justify="space-between" wrap="wrap">
                    <Text size="xl" fw={700} style={{ 
                      fontSize: 'min(24px, 5.5vw)',
                      wordBreak: 'break-word'
                    }}>
                      {post.title}
                    </Text>
                    <Text size="xs" color="dimmed">{formatDate(post.created_at)}</Text>
                  </Group>
                  <Group gap="xs">
                    <IconUser style={{ color: '#3f6cd4' }} />
                    <Text size="sm" fw={500}>{post.username || "Anonymous"}</Text>
                  </Group>
                  
                  {post.image && (
                    <div style={{ 
                      width: '100%', 
                      position: 'relative',
                      borderRadius: '8px',
                      margin: '0.5rem 0'
                    }}>
                      <div style={{ 
                        position: 'relative', 
                        maxHeight: expandedImage === post.image ? '80vh' : '400px',
                        overflow: expandedImage === post.image ? 'visible' : 'hidden',
                        transition: 'all 0.3s ease',
                        borderRadius: '8px',
                      }}>
                        <Image 
                          src={post.image} 
                          fit="contain"
                          style={{
                            maxHeight: expandedImage === post.image ? '80vh' : '400px',
                            width: '100%',
                            objectFit: 'contain',
                            backgroundColor: expandedImage === post.image ? 'rgba(0,0,0,0.7)' : 'transparent',
                            borderRadius: '8px',
                            transition: 'all 0.3s ease',
                          }}
                          alt="Post Image" 
                        />
                        
                        {/* Expand/collapse button */}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedImage(expandedImage === post.image ? null : post.image || null);
                          }}
                          size="sm"
                          variant="light"
                          style={{
                            position: 'absolute',
                            bottom: '10px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 2,
                            backgroundColor: 'rgba(255,255,255,0.8)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          }}
                          leftSection={expandedImage === post.image ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
                        >
                          {expandedImage === post.image ? 'Collapse' : 'Expand'}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <Text size="md" style={{ 
                    lineHeight: 1.7,
                    fontSize: 'min(16px, 4.2vw)', // Responsive font size
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word'
                  }}>
                    {post.content}
                  </Text>
                  
                  <Divider />
                  
                  {/* Vote buttons - more compact on mobile */}
                  <Group justify="apart" wrap="wrap">
                    <Group gap="xs">
                      <Button 
                        variant={userVote === 'up' ? "filled" : "subtle"}
                        leftSection={<IconArrowUp size={16} />}
                        onClick={() => handleVote('up')}
                        style={userVote === 'up' ? { backgroundColor: '#4CAF50', color: 'white' } : {}}
                        size="xs"
                      >
                        {(post?.upvotes ?? 0).toLocaleString()}
                      </Button>
                      <Button 
                        variant={userVote === 'down' ? "filled" : "subtle"}
                        leftSection={<IconArrowDown style={{ fontSize: 'min(16px, 4vw)' }} />}
                        onClick={() => handleVote('down')}
                        style={userVote === 'down' ? { backgroundColor: '#F44336', color: 'white' } : {}}
                        size="xs"
                      >
                        {post.downvotes || 0}
                      </Button>
                    </Group>
                  </Group>
                </Stack>
              </Card>
              
              {/* Responsive layout for discussion */}
              <div style={{ width: '100%' }}>
                {/* Reply form section */}
                <Card shadow="sm" padding="md" radius="sm" withBorder style={{ marginBottom: '1rem' }}>
                  <Stack gap="sm">
                    <Text fw={600} size="md">Add a Reply</Text>
                    <Textarea
                      placeholder="Share your thoughts..."
                      minRows={5}
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      disabled={!user}
                    />
                    <Group justify="space-between">
                      {!user && (
                        <Button variant="outline" onClick={() => setLoginModalOpen(true)} size="sm">
                          Sign in to participate
                        </Button>
                      )}
                      <Button
                        leftSection={<IconSend />}
                        onClick={handleSubmitReply}
                        loading={submittingReply}
                        disabled={!user || !newReply.trim()}
                        style={{ backgroundColor: '#3f6cd4' }}
                        ml="auto"
                      >
                        Post Reply
                      </Button>
                    </Group>
                  </Stack>
                </Card>
                
                {/* Replies section */}
                <div>
                  <Group justify="space-between" mb="md">
                    <Text fw={600} size="lg">Discussion</Text>
                    <Text fw={500} size="sm" color="dimmed">{replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}</Text>
                  </Group>
                  
                  {replies.length > 0 ? (
                    <Stack gap="md">
                      {organizedReplies.map((reply) => (
                        <ReplyCard 
                          key={reply.id} 
                          reply={reply} 
                          depth={0} 
                          parentExpanded={true} // Top level replies are always visible
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Card shadow="sm" padding="md" radius="sm" withBorder>
                      <Stack align="center" gap="md" py="lg">
                        <Text ta="center" color="dimmed">No replies yet.</Text>
                        <Text ta="center" size="sm">Be the first to share your thoughts!</Text>
                      </Stack>
                    </Card>
                  )}
                </div>
              </div>
            </Stack>
          </div>
        </ScrollArea>
      </div>
      
      {/* Login Modal */}
      <Modal
        opened={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        title="Sign In Required"
        size="sm"
      >
        <Stack gap="md">
          <Text>Please sign in to continue.</Text>
          <Button
            onClick={handleGoogleLogin}
            fullWidth
            style={{
              backgroundColor: '#fff',
              color: '#000',
              border: '1px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>
          <Text size="sm" color="dimmed" ta="center" mt="sm">
            You need to be signed in to reply and vote.
          </Text>
        </Stack>
      </Modal>
      
      {/* Fullscreen image overlay */}
      {expandedImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
          }}
          onClick={() => setExpandedImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
            <Image 
              src={expandedImage} 
              fit="contain"
              style={{
                maxHeight: '90vh',
                maxWidth: '90vw',
                objectFit: 'contain',
              }}
              alt="Full size image" 
            />
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedImage(null);
              }}
              size="sm"
              variant="subtle"
              color="gray"
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1001,
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                padding: 0,
                minWidth: 'unset',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.2)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </div>
        </div>
      )}
    </Stack>
  );
}