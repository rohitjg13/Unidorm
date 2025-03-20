import { Group, SimpleGrid, Stack, Box, Image, TextInput, ActionIcon, rem, LoadingOverlay } from "@mantine/core";
import styles from "../../../styles/Template.module.css";
import React, { useEffect, useState, useRef } from "react";
import { ArrowBack, AccountCircle } from "@material-ui/icons";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import classes from "../../../styles/Mantine/FloatingLabelInput.module.css";
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "../../components/ui/button"
import { Calendar } from "../../components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover"
import { format } from "date-fns"
import { TimeInput } from '@mantine/dates';
import { IconClock } from '@tabler/icons-react';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from 'next/router';
import supabase from '../../utils/supabase/client';
import { notifications } from '@mantine/notifications';

export default function CheckOutStudent() {
  const [focusedName, setFocused] = useState(false);
  const [name, setName] = useState("");
  const floatingName = name.trim().length !== 0 || focusedName || undefined;

  const [date, setDate] = React.useState<Date>()
  const [outTime, setOutTime] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        // Fetch user details to pre-fill name
        const { data: userData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();
        
        if (userData?.full_name) {
          setName(userData.full_name);
        }
      } else {
        notifications.show({
          title: 'Authentication required',
          message: 'Please log in to continue',
          color: 'red',
        });
        router.push('/login');
      }
    };
    
    checkUser();
  }, [router]);

  const pickerControl = (
    <ActionIcon variant="subtle" color="gray" onClick={() => ref.current?.showPicker()}>
      <IconClock style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
    </ActionIcon>
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!name || !date || !outTime || !imageFile || !userId) {
      notifications.show({
        title: 'Missing information',
        message: 'Please fill out all fields and upload your DigiCampus screenshot',
        color: 'red',
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Upload the image to Supabase storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const { data: fileData, error: fileError } = await supabase.storage
        .from('checkout-images')
        .upload(fileName, imageFile);

      if (fileError) throw fileError;

      // 2. Get the public URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from('checkout-images')
        .getPublicUrl(fileName);
      
      const imageUrl = urlData.publicUrl;

      // 3. Create checkout record in database
      const checkoutData = {
        user_id: userId,
        student_name: name,
        checkout_date: date?.toISOString().split('T')[0],
        checkout_time: outTime,
        image_url: imageUrl,
        status: 'pending',
        created_at: new Date(),
      };

      const { error: insertError } = await supabase
        .from('checkouts')
        .insert(checkoutData);

      if (insertError) throw insertError;

      notifications.show({
        title: 'Success',
        message: 'Your check-out request has been submitted',
        color: 'green',
      });

      // Reset form
      setDate(undefined);
      setOutTime('');
      setImageFile(null);
      
      // Redirect to a confirmation page or back to home
      router.push('/CheckInOut');
      
    } catch (error) {
      console.error('Error submitting checkout:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to submit your check-out request. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack justify="flex-start" gap={0} className={styles.container}>
      <LoadingOverlay visible={loading} />
      <SimpleGrid className={styles.header} cols={2}>
        <ArrowBack 
          style={{ scale: "1.75", color: "white", cursor: "pointer" }} 
          onClick={() => router.push('/CheckInOut')}
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink style={{color: "#dedede"}} href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white" />
            <BreadcrumbItem>
              <BreadcrumbLink style={{color: "#dedede"}} href="/CheckInOut">Check In / Check Out</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white">Check Out</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <AccountCircle style={{ scale: "1.75", color: "white" }} />
      </SimpleGrid>

      <Stack className={styles.bottom}>
        <SimpleGrid cols={1} style={{ width: "80%" }} spacing="4rem">
            <TextInput
                label="Name"
                required
                classNames={classes}
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoComplete="nope"
                data-floating={floatingName}
                labelProps={{ 'data-floating': floatingName }}
                radius={10}
            />
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant={"outline"}
                    className={cn(
                        "w-[100%] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                    style={{ borderRadius: 10 }}
                    >
                    <CalendarIcon />
                    {date ? format(date, "PPP") : <span>Out Date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    />
                </PopoverContent>
            </Popover>
            <TimeInput 
              label="Out Time" 
              ref={ref} 
              style={{color: "black"}} 
              radius={10}
              rightSection={pickerControl}
              value={outTime}
              onChange={(e) => setOutTime(e.currentTarget.value)}
            />
            <div className="grid w-full max-w-sm items-center gap-1.5 text-black">
                <Label htmlFor="picture">Upload DigiCampus</Label>
                <Input 
                  style={{ borderRadius: 10 }} 
                  id="picture" 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
            </div>
            <Button 
              variant="outline" 
              size={"lg"} 
              color="blue" 
              style={{ width: "100%", borderRadius: 10 }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
        </SimpleGrid>
      </Stack>

      <Box 
        style={{ position: "fixed", bottom: 0, width: "100vw"}}
        className={styles.vectorContainer} // Add this class
      >
        <Image src="../../images/vector.svg" radius="md" style={{ width: "100%", margin: 0 }} alt="" />
      </Box>
    </Stack>
  );
}
