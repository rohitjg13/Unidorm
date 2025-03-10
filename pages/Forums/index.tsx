import { Card, Text, Group, Stack, Button, Image, Divider, SimpleGrid, ScrollArea, Modal, TextInput, Textarea, FileInput } from "@mantine/core";
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
import { v4 as uuidv4 } from 'uuid';
import { User } from '@supabase/supabase-js'; 

const initialForumPosts: ForumPost[] = []; // Empty array as fallback data

interface ForumPost {
  id: string;
  title: string;
  content: string;
  image?: string;
  created_at?: string;
  upvotes?: number;
  downvotes?: number;
  username?: string;
  replies_count?: number;
}

export default function Forum() {
  const router = useRouter();

  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostModalOpen, setNewPostModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [newPost, setNewPost] = useState<{
    title: string;
    content: string;
    image: File | null;
    imagePreview: string | null;
  }>({
    title: '',
    content: '',
    image: null,
    imagePreview: null
  });
  
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userVotes, setUserVotes] = useState<{ [key: string]: 'up' | 'down' | undefined }>({});
  const [initialVotesLoaded, setInitialVotesLoaded] = useState(false);
  const [trendingTimePeriod, setTrendingTimePeriod] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
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
          updatedVotes = { upvotes: Math.max(0, (post.upvotes || 1) - 1) };
        } else {
          updatedVotes = { downvotes: Math.max(0, (post.downvotes || 1) - 1) };
        }

        // Remove vote from database
        const { error: deleteError } = await supabase
          .from('forum_post_votes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user?.id);
          
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
              upvotes: Math.max(0, (post.upvotes || 1) - 1),
              downvotes: (post.downvotes || 1) + 1 
            };
          } else {
            // Changing from downvote to upvote
            updatedVotes = { 
              upvotes: (post.upvotes || -1) + 1,
              downvotes: Math.max(0, (post.downvotes || 1) - 1) 
            };
          }
          
          // Update vote in database
          const { error: updateError } = await supabase
            .from('forum_post_votes')
            .update({ vote_type: voteType })
            .eq('post_id', postId)
            .eq('user_id', user?.id || '');
            
          if (updateError) {
            console.error('Error updating vote:', updateError);
            return;
          }
        } 
        else {
          // User is voting for the first time
          if (voteType === 'up') {
            updatedVotes = { upvotes: (post.upvotes || 0) + 1 };
          } else {
            updatedVotes = { downvotes: (post.downvotes || 0) + 1 };
          }
          
          // Insert new vote
          const { error: insertError } = await supabase
            .from('forum_post_votes')
            .insert({ 
              post_id: postId, 
              user_id: (user?.id || ''), 
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
            const votes: { [key: string]: 'up' | 'down' } = {};
            data.forEach(vote => {
              votes[vote.post_id] = vote.vote_type;
            });
            
            setUserVotes(votes);
            setInitialVotesLoaded(true);
          } catch (error) {
            console.error('Unexpected error fetching votes:', error);
          }
        };

        fetchUserVotes();
      }
    } catch (error) {
      console.error('Unexpected error during voting:', error);
    }
  };

  // Navigate to post detail page
  const goToPostDetail = (postId: string) => {
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
      
      // Show loading state
      setIsSubmitting(true);
      
      // Upload image if one is selected
      let imageUrl = null;
      if (newPost.image) {
        imageUrl = await uploadImage(newPost.image);
      }
      
      // Create post data object
      const postData = {
        title: newPost.title,
        content: newPost.content,
        image: imageUrl, // Use the uploaded image URL
        upvotes: 0,
        downvotes: 0,
        user_id: user?.id || '',
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

      // Update local state with the returned data
      setForumPosts(posts => [data[0], ...posts]);
      setNewPostModalOpen(false);
      setNewPost({ title: '', content: '', image: null, imagePreview: null });
    } catch (error) {
      console.error('Unexpected error during post creation:', error);
    } finally {
      setIsSubmitting(false);
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
        const votes: { [key: string]: 'up' | 'down' } = {};
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

  interface FilteredPostsParams {
    allPosts: ForumPost[];
    timePeriod: string;
  }

  const getFilteredPosts = ({ allPosts, timePeriod }: FilteredPostsParams): ForumPost[] => {
    const now = new Date();
    
    const filtered = allPosts.filter(post => {
      if (!post.created_at) return false;
      
      const postDate = new Date(post.created_at);
      
      switch (timePeriod) {
        case 'today':
          // Same day, month, and year
          return postDate.getDate() === now.getDate() && 
                 postDate.getMonth() === now.getMonth() && 
                 postDate.getFullYear() === now.getFullYear();
        case 'week':
          // Within the last 7 days
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return postDate >= weekAgo;
        case 'month':
          // Same month and year
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          return postDate >= monthAgo;
        case 'year':
          // Same year
          return postDate.getFullYear() === now.getFullYear();
        case 'all':
        default:
          return true;
      }
    });
    
    // Sort by upvotes (highest first)
    return filtered.sort((a, b) => {
      const aUpvotes = a.upvotes || 0;
      const bUpvotes = b.upvotes || 0;
      
      if (bUpvotes !== aUpvotes) {
        return bUpvotes - aUpvotes;
      }
      
      // If upvotes are equal, sort by recency
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    });
  };

  // Render a single post card
  const renderPostCard = (post: ForumPost) => (
    <Card 
      key={post.id} 
      shadow="sm" 
      padding="md" 
      radius="md" 
      withBorder
      onClick={() => goToPostDetail(post.id)}
      style={{ 
        cursor: 'pointer',
        width: '100%' // Ensure cards take full width
      }}
    >
      <Stack>
        <Group justify="apart">
          <Text style={{ fontWeight: "bold" }}>{post.title}</Text>
          <Text size="xs" color="gray">
            {post.created_at ? new Date(post.created_at).toLocaleString() : "Recently"}
          </Text>
        </Group>
        <Text size="sm" color="gray">Posted by {post.username || "Anonymous"}</Text>
        
        {/* Update image display to maintain aspect ratio */}
        {post.image && (
          <div style={{ 
            width: '100%', 
            height: '200px', 
            overflow: 'hidden', 
            position: 'relative',
            borderRadius: '8px'
          }}>
            <Image 
              src={post.image} 
              alt="Post Image" 
              fit="contain"
              style={{
                maxHeight: '200px',
                maxWidth: '100%',
                margin: '0 auto',
                display: 'block'
              }}
            />
          </div>
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
            {post.replies_count || 0} Replies
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
          <Group justify="right">
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
      
      <Group style={{
          position: 'relative',
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
          top: 0,
          bottom: 0,
          margin: 0,
          borderRadius: '4rem 4rem 0 0',
          boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)',
      }}>
        <Stack gap="lg" p="md" style={{ 
          maxWidth: "600px", 
          margin: "auto", 
          height: "100%", 
          width: "100%",
          position: 'relative' // Add relative positioning to the container
        }}>
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
                  <Text ta="center" py="xl">Loading posts...</Text>
                ) : (
                  <Stack gap="md">
                    {forumPosts.length > 0 ? 
                      forumPosts.map(renderPostCard) : 
                      <Text ta="center" py="xl">No posts yet. Be the first to post!</Text>
                    }
                  </Stack>
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="trending">
              <div style={{ padding: "0 0 16px 0" }}>
                <Tabs value={trendingTimePeriod} onValueChange={setTrendingTimePeriod} className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="month">Month</TabsTrigger>
                    <TabsTrigger value="year">Year</TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <ScrollArea
                style={{ height: "calc(100vh - 230px)" }}
                scrollbarSize={0}
              >
                {loading ? (
                  <Text ta="center" py="xl">Loading posts...</Text>
                ) : (
                  <Stack gap="md">
                    {forumPosts.length > 0 ? 
                      getFilteredPosts({ allPosts: forumPosts, timePeriod: trendingTimePeriod }).map(renderPostCard) : 
                      <Text ta="center" py="xl">No posts yet. Be the first to post!</Text>
                    }
                    {getFilteredPosts({ allPosts: forumPosts, timePeriod: trendingTimePeriod }).length === 0 && forumPosts.length > 0 && (
                      <Text ta="center" py="xl">No posts for this time period. Try another filter.</Text>
                    )}
                  </Stack>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Stack>
      </Group>

      {/* Floating action button - moved outside the content area */}
      <Button 
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          padding: 0,
          zIndex: 1000,
          backgroundColor: '#3f6cd4',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        }}
        onClick={showNewPostModal}
      >
        <Add style={{ fontSize: '20px' }} />
      </Button>

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
          
          {/* Replace the TextInput with FileInput for image */}
          <FileInput
            label="Upload Image (optional)"
            placeholder="Choose image"
            accept="image/*"
            onChange={(file) => {
              if (file) {
                // Create a preview URL for the selected file
                const preview = URL.createObjectURL(file);
                setNewPost({...newPost, image: file, imagePreview: preview});
              } else {
                setNewPost({...newPost, image: null, imagePreview: null});
              }
            }}
            clearable
          />
          
          {/* Show image preview if available */}
          {newPost.imagePreview && (
            <div style={{ position: 'relative', marginTop: '8px' }}>
              <Image 
                src={newPost.imagePreview} 
                height={150} 
                fit="cover" 
                radius="md" 
                alt="Preview" 
              />
              <Button 
                size="xs" 
                color="red" 
                style={{ 
                  position: 'absolute', 
                  top: '8px', 
                  right: '8px',
                  borderRadius: '50%',
                  padding: 0,
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 'unset'
                }}
                onClick={() => setNewPost({...newPost, image: null, imagePreview: null})}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            </div>
          )}
          
          {/* Add loading state to the button */}
          <Button 
            onClick={handleCreatePost}
            disabled={!newPost.title || !newPost.content || isSubmitting}
            loading={isSubmitting}
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
            You need to be signed in to create posts and vote.
          </Text>
        </Stack>
      </Modal>
    </Stack>
  );
}

// Function to handle image upload to Supabase Storage - FIXED
interface UploadImageResponse {
  publicUrl: string | null;
}

const uploadImage = async (file: File | null): Promise<string | null> => {
  try {
    if (!file) return null;
    
    // Generate a unique filename to prevent collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    
    // IMPORTANT: Don't include the bucket name in the file path
    // Just use a simple path without 'forum-images/'
    const filePath = `posts/${fileName}`; // Or use 'posts/${fileName}' but not 'forum-images/...'
    
    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('forum-images') // This specifies the bucket name already
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Changed to true for better reliability
      });
    
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      
      // If bucket not found, give more specific error
      if (uploadError.message && uploadError.message.includes("Bucket not found")) {
        alert('Storage setup issue: Bucket not found. Please contact support.');
      } else {
        alert(`Upload failed: ${uploadError.message}`);
      }
      return null;
    }

    // Get the public URL for the uploaded image
    const { data } = supabase
      .storage
      .from('forum-images')
      .getPublicUrl(filePath) as { data: UploadImageResponse };

    console.log("Successfully uploaded image. URL:", data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Unexpected error during image upload:', error);
    alert('Something went wrong with the image upload. Please try again.');
    return null;
  }
};
