import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { Card, Text, Group, Stack, Button, Image, Divider, SimpleGrid, ScrollArea, Modal, Textarea } from "@mantine/core";
import { ArrowBack, AccountCircle, ArrowUpward, ArrowDownward, Send } from "@material-ui/icons";
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
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  paddingTop: '0rem',
  fontSize: 'calc(10px + 2vmin)',
  color: '#3f6cd4',
  position: 'relative',
  top: 0,
  bottom: 0,
  margin: 0,
  borderRadius: '4rem 4rem 0 0',
  boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)',
};

export default function PostDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [post, setPost] = useState<{ id: string; title: string; content: string; created_at: string; username: string; image?: string; upvotes: number; downvotes: number } | null>(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [newReply, setNewReply] = useState("");
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [submittingReply, setSubmittingReply] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        
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
  const handleVote = async (voteType) => {
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
          .eq('post_id', id)
          .eq('user_id', user.id);
          
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
            .eq('post_id', id)
            .eq('user_id', user.id);
            
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
              post_id: id, 
              user_id: user.id, 
              vote_type: voteType 
            });
            
          if (insertError) {
            console.error('Error inserting vote:', insertError);
            return;
          }
        }
        
        setUserVote(voteType);
      }
      
      // Update post in database
      const voteData = {
        upvotes: updatedVotes.upvotes,
        downvotes: updatedVotes.downvotes
      };
      
      const { error } = await supabase
        .from('forum_posts')
        .update(voteData)
        .eq('id', id);
        
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
        user_id: user.id,
        username: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous'
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Stack justify="flex-start" gap={0} className={styles.container}>
        <SimpleGrid className={styles.header} cols={2}>
          <ArrowBack 
            style={{ scale: "1.75", color: "white", cursor: "pointer" }} 
            onClick={goBack}
          />
          <div />
          <div />
        </SimpleGrid>
        <Group style={bottomStyles}>
          <Text align="center" py="xl" size="lg">Loading post...</Text>
        </Group>
      </Stack>
    );
  }

  if (!post) {
    return (
      <Stack justify="flex-start" gap={0} className={styles.container}>
        <SimpleGrid className={styles.header} cols={2}>
          <ArrowBack 
            style={{ scale: "1.75", color: "white", cursor: "pointer" }} 
            onClick={goBack}
          />
          <div />
          <div />
        </SimpleGrid>
        <Group style={bottomStyles}>
          <Text align="center" py="xl" size="lg">Post not found</Text>
          <Button onClick={goBack}>Return to Forums</Button>
        </Group>
      </Stack>
    );
  }

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
              <BreadcrumbLink style={{color: "#dedede"}} href="/Forums">Forums</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white">Post</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {user ? (
          <Group position="right">
            <Text color="white" size="sm">{user.user_metadata?.name || user.email?.split('@')[0]}</Text>
            <AccountCircle style={{ scale: "1.75", color: "white" }} />
          </Group>
        ) : (
          <Button 
            variant="subtle" 
            color="white"
            onClick={() => setLoginModalOpen(true)}
          >
            <AccountCircle style={{ scale: "1.75", color: "white" }} />
          </Button>
        )}
      </SimpleGrid>
      
      <Group style={{ ...bottomStyles, position: 'relative' }}>
        <ScrollArea
          style={{ height: "calc(100vh - 70px)", width: "100%", maxWidth: "800px", margin: "auto" }}
          scrollbarSize={8}
        >
          <Stack spacing="md" p="md">
            {/* Post card */}
            <Card 
              shadow="sm" 
              padding="lg" 
              radius="md" 
              withBorder
              style={{ marginBottom: "1rem" }}
            >
              <Stack spacing="md">
                <Group position="apart">
                  <Text size="xl" weight={500}>{post.title}</Text>
                  <Text size="xs" color="gray">{formatDate(post.created_at)}</Text>
                </Group>
                <Text size="sm" color="gray">Posted by {post.username || "Anonymous"}</Text>
                {post.image && (
                  <Image src={post.image} height={300} radius="md" alt="Post Image" />
                )}
                <Text size="md">{post.content}</Text>
                <Divider />
                <Group spacing="lg">
                  <Button 
                    variant={userVote === 'up' ? "filled" : "subtle"}
                    leftSection={<ArrowUpward />}
                    onClick={() => handleVote('up')}
                    style={userVote === 'up' ? { backgroundColor: '#4CAF50', color: 'white' } : {}}
                  >
                    {post.upvotes || 0}
                  </Button>
                  <Button 
                    variant={userVote === 'down' ? "filled" : "subtle"}
                    leftSection={<ArrowDownward />}
                    onClick={() => handleVote('down')}
                    style={userVote === 'down' ? { backgroundColor: '#F44336', color: 'white' } : {}}
                  >
                    {post.downvotes || 0}
                  </Button>
                  <Text>{replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}</Text>
                </Group>
              </Stack>
            </Card>
            
            {/* Reply input */}
            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Stack spacing="sm">
                <Text weight={500}>Add a Reply</Text>
                <Textarea
                  placeholder="Write your reply here..."
                  minRows={3}
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  disabled={!user}
                />
                <Group position="right">
                  <Button
                    leftSection={<Send />}
                    onClick={handleSubmitReply}
                    loading={submittingReply}
                    disabled={!user || !newReply.trim()}
                    style={{ backgroundColor: '#3f6cd4' }}
                  >
                    Post Reply
                  </Button>
                </Group>
                {!user && (
                  <Text size="sm" color="dimmed" align="center">
                    Please <Button variant="subtle" compact onClick={() => setLoginModalOpen(true)}>sign in</Button> to reply.
                  </Text>
                )}
              </Stack>
            </Card>
            
            {/* Replies section */}
            <Text weight={500} size="lg" mt="lg">Replies</Text>
            {replies.length > 0 ? (
              replies.map((reply) => (
                <Card 
                  key={reply.id} 
                  shadow="sm" 
                  padding="md" 
                  radius="md" 
                  withBorder
                >
                  <Stack spacing="xs">
                    <Group position="apart">
                      <Text weight={500}>{reply.username || "Anonymous"}</Text>
                      <Text size="xs" color="gray">{formatDate(reply.created_at)}</Text>
                    </Group>
                    <Text>{reply.content}</Text>
                  </Stack>
                </Card>
              ))
            ) : (
              <Card shadow="sm" padding="xl" radius="md" withBorder>
                <Text align="center" color="dimmed">No replies yet. Be the first to reply!</Text>
              </Card>
            )}
          </Stack>
        </ScrollArea>
      </Group>
      
      {/* Login Modal */}
      <Modal
        opened={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        title="Sign In Required"
        size="sm"
      >
        <Stack spacing="md">
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
          <Text size="sm" color="dimmed" align="center" mt="sm">
            You need to be signed in to reply and vote.
          </Text>
        </Stack>
      </Modal>
    </Stack>
  );
}