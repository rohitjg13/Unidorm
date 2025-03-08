import { Card, Text, Group, Stack, Button, Image, Divider, SimpleGrid, ScrollArea, Modal, TextInput, Textarea } from "@mantine/core";
import { ArrowBack, AccountCircle, ArrowUpward, ArrowDownward, ChatBubble, Add } from "@material-ui/icons";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import styles from "../../styles/Template.module.css";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from "@/components/ui/breadcrumb"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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

export default function Forum() {
  const router = useRouter();
  const [forumPosts, setForumPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostModalOpen, setNewPostModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    image: ''
  });
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userVotes, setUserVotes] = useState({});
  const [initialVotesLoaded, setInitialVotesLoaded] = useState(false);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setAuthChecked(true);
      }
    };
    
    checkAuth();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch posts from Supabase
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('forum_posts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching forum posts:', error);
          setForumPosts(initialForumPosts); // Fallback to initial data
        } else {
          setForumPosts(data || []);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setForumPosts(initialForumPosts); // Fallback to initial data
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/Forums`
        }
      });
      
      if (error) {
        console.error('Error signing in with Google:', error);
      }
    } catch (error) {
      console.error('Error during Google sign-in:', error);
    }
  };

  // Check if user is logged in, show login modal if not
  const checkAuth = () => {
    if (!user) {
      setLoginModalOpen(true);
      return false;
    }
    return true;
  };

  // Handle upvote/downvote with Supabase
  const handleVote = async (postId, voteType) => {
    try {
      // Check if user is logged in
      if (!checkAuth()) return;
      
      const post = forumPosts.find(p => p.id === postId);
      if (!post) return;

      const currentVote = userVotes[postId];
      let updatedVotes = {};
      
      // Determine what action to take based on current vote
      if (currentVote === voteType) {
        // User is clicking the same button again - remove their vote
        if (voteType === 'up') {
          updatedVotes = { upvotes: Math.max(0, post.upvotes - 1) };
        } else {
          updatedVotes = { downvotes: Math.max(0, post.downvotes - 1) };
        }
        
        // Remove vote from database
        const { error: deleteError } = await supabase
          .from('forum_post_votes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
          
        if (deleteError) {
          console.error('Error removing vote:', deleteError);
          return;
        }
        
        // Update local state
        setUserVotes(prev => {
          const newVotes = { ...prev };
          delete newVotes[postId];
          return newVotes;
        });
      } 
      else {
        // User is either voting for the first time or changing their vote
        if (currentVote) {
          // User is changing their vote
          if (currentVote === 'up') {
            // Changing from upvote to downvote
            updatedVotes = { 
              upvotes: Math.max(0, post.upvotes - 1),
              downvotes: post.downvotes + 1 
            };
          } else {
            // Changing from downvote to upvote
            updatedVotes = { 
              upvotes: post.upvotes + 1,
              downvotes: Math.max(0, post.downvotes - 1) 
            };
          }
          
          // Update vote in database
          const { error: updateError } = await supabase
            .from('forum_post_votes')
            .update({ vote_type: voteType })
            .eq('post_id', postId)
            .eq('user_id', user.id);
            
          if (updateError) {
            console.error('Error updating vote:', updateError);
            return;
          }
        } 
        else {
          // User is voting for the first time
          if (voteType === 'up') {
            updatedVotes = { upvotes: post.upvotes + 1 };
          } else {
            updatedVotes = { downvotes: post.downvotes + 1 };
          }
          
          // Insert new vote
          const { error: insertError } = await supabase
            .from('forum_post_votes')
            .insert({ 
              post_id: postId, 
              user_id: user.id, 
              vote_type: voteType 
            });
            
          if (insertError) {
            console.error('Error inserting vote:', insertError);
            return;
          }
        }
        
        // Update local state
        setUserVotes(prev => ({
          ...prev,
          [postId]: voteType
        }));
      }

      // Optimistic update of post vote counts
      setForumPosts(posts => posts.map(p => 
        p.id === postId ? { ...p, ...updatedVotes } : p
      ));

      // Update post vote counts in database
      const { error } = await supabase
        .from('forum_posts')
        .update(updatedVotes)
        .eq('id', postId);

      if (error) {
        console.error('Error updating post votes:', error);
        // Revert optimistic update on error
        fetchPosts();
        fetchUserVotes();
      }
    } catch (error) {
      console.error('Unexpected error during voting:', error);
    }
  };

  // Navigate to post detail page
  const goToPostDetail = (postId) => {
    router.push(`/Forums/${postId}`);
  };

  // Go back to previous page
  const goBack = () => {
    router.back();
  };

  // Open new post modal with auth check
  const showNewPostModal = () => {
    if (checkAuth()) {
      setNewPostModalOpen(true);
    }
  };

  // Handle creating a new post with Supabase
  const handleCreatePost = async () => {
    try {
      if (!user) {
        setLoginModalOpen(true);
        return;
      }

      if (!newPost.title || !newPost.content) {
        return;
      }
      
      // Create post data object without ID - Supabase will generate it
      const postData = {
        title: newPost.title,
        content: newPost.content,
        image: newPost.image || null,
        upvotes: 0,
        downvotes: 0,
        user_id: user.id,
        username: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous'
      };

      // Insert post into Supabase
      const { data, error } = await supabase
        .from('forum_posts')
        .insert([postData])
        .select();

      if (error) {
        console.error('Error creating post:', error);
        return;
      }

      // Update local state with the returned data (which includes the generated ID)
      setForumPosts(posts => [data[0], ...posts]);
      setNewPostModalOpen(false);
      setNewPost({ title: '', content: '', image: '' });
    } catch (error) {
      console.error('Unexpected error during post creation:', error);
    }
  };

  // Fetch posts function for refreshing data
  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching forum posts:', error);
      } else {
        setForumPosts(data || []);
      }
    } catch (error) {
      console.error('Unexpected error refreshing posts:', error);
    }
  };

  // Fetch user votes when user is authenticated
  useEffect(() => {
    const fetchUserVotes = async () => {
      if (!user) {
        setUserVotes({});
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('forum_post_votes')
          .select('post_id, vote_type')
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Error fetching user votes:', error);
          return;
        }
        
        // Transform to object for easy lookup
        const votes = {};
        data.forEach(vote => {
          votes[vote.post_id] = vote.vote_type;
        });
        
        setUserVotes(votes);
        setInitialVotesLoaded(true);
      } catch (error) {
        console.error('Unexpected error fetching votes:', error);
      }
    };
    
    if (user) {
      fetchUserVotes();
    }
  }, [user]);

  // Render a single post card
  const renderPostCard = (post) => (
    <Card 
      key={post.id} 
      shadow="sm" 
      padding="md" 
      radius="md" 
      withBorder
      onClick={() => goToPostDetail(post.id)}
      style={{ cursor: 'pointer' }}
    >
      <Stack>
        <Group position="apart">
          <Text style={{ fontWeight: "bold" }}>{post.title}</Text>
          <Text size="xs" color="gray">
            {post.created_at ? new Date(post.created_at).toLocaleString() : post.timestamp || "Recently"}
          </Text>
        </Group>
        <Text size="sm" color="gray">Posted by {post.username || post.user || "Anonymous"}</Text>
        {post.image && (
          <Image src={post.image} height={150} radius="md" alt="Post Image" />
        )}
        <Text size="sm">{post.content}</Text>
        <Divider />
        <Group>
          <Group gap="xs">
            <Button 
              variant={userVotes[post.id] === 'up' ? "filled" : "subtle"}
              size="xs" 
              leftSection={<ArrowUpward />}
              onClick={(e) => {
                e.stopPropagation();
                handleVote(post.id, 'up');
              }}
              style={userVotes[post.id] === 'up' ? { backgroundColor: '#4CAF50', color: 'white' } : {}}
            >
              {post.upvotes || 0}
            </Button>
            <Button 
              variant={userVotes[post.id] === 'down' ? "filled" : "subtle"}
              size="xs" 
              leftSection={<ArrowDownward />}
              onClick={(e) => {
                e.stopPropagation();
                handleVote(post.id, 'down');
              }}
              style={userVotes[post.id] === 'down' ? { backgroundColor: '#F44336', color: 'white' } : {}}
            >
              {post.downvotes || 0}
            </Button>
          </Group>
          <Button 
            variant="subtle" 
            size="xs" 
            leftSection={<ChatBubble />}
            onClick={(e) => {
              e.stopPropagation();
              goToPostDetail(post.id);
            }}
          >
            {post.replies_count || post.replies || 0} Replies
          </Button>
        </Group>
      </Stack>
    </Card>
  );

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
              <BreadcrumbPage className="text-white">Forums</BreadcrumbPage>
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
        {/* Floating action button to create new post */}
        <Button 
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            padding: 0,
            zIndex: 1000,
            backgroundColor: '#3f6cd4'
          }}
          onClick={showNewPostModal}
        >
          <Add style={{ fontSize: '24px' }} />
        </Button>

        <Stack gap="lg" p="md" style={{ maxWidth: "600px", margin: "auto", height: "100%", width: "100%" }}>
          <Tabs defaultValue="new" className="w-full">
            <TabsList className="grid w-[80%] mx-auto grid-cols-2">
              <TabsTrigger value="new">New</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
            </TabsList>
            <TabsContent value="new">
              <ScrollArea
                style={{ height: "calc(100vh - 180px)" }}
                scrollbarSize={0}
              >
                {loading ? (
                  <Text align="center" py="xl">Loading posts...</Text>
                ) : (
                  <Stack spacing="md">
                    {forumPosts.length > 0 ? 
                      forumPosts.map(renderPostCard) : 
                      <Text align="center" py="xl">No posts yet. Be the first to post!</Text>
                    }
                  </Stack>
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="trending">
              <ScrollArea
                style={{ height: "calc(100vh - 180px)" }}
                scrollbarSize={0}
              >
                {loading ? (
                  <Text align="center" py="xl">Loading posts...</Text>
                ) : (
                  <Stack spacing="md">
                    {forumPosts.length > 0 ? 
                      [...forumPosts]
                        .sort((a, b) => b.upvotes - a.upvotes)
                        .map(renderPostCard) : 
                      <Text align="center" py="xl">No posts yet. Be the first to post!</Text>
                    }
                  </Stack>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Stack>
      </Group>

      {/* New Post Modal */}
      <Modal
        opened={newPostModalOpen}
        onClose={() => setNewPostModalOpen(false)}
        title="Create New Post"
        size="md"
      >
        <Stack>
          <TextInput
            label="Title"
            placeholder="Enter post title"
            value={newPost.title}
            onChange={(e) => setNewPost({...newPost, title: e.target.value})}
            required
          />
          <Textarea
            label="Content"
            placeholder="Share your thoughts..."
            minRows={4}
            value={newPost.content}
            onChange={(e) => setNewPost({...newPost, content: e.target.value})}
            required
          />
          <TextInput
            label="Image URL (optional)"
            placeholder="Enter image URL"
            value={newPost.image}
            onChange={(e) => setNewPost({...newPost, image: e.target.value})}
          />
          <Button 
            onClick={handleCreatePost}
            disabled={!newPost.title || !newPost.content}
            style={{ backgroundColor: '#3f6cd4' }}
          >
            Post
          </Button>
        </Stack>
      </Modal>

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
            You need to be signed in to create posts and vote.
          </Text>
        </Stack>
      </Modal>
    </Stack>
  );
}
