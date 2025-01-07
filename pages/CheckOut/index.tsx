import { Group, SimpleGrid, Stack, Box, Image, TextInput, ActionIcon, rem } from "@mantine/core";
import styles from "../../styles/Template.module.css";
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
import classes from "../../styles/Mantine/FloatingLabelInput.module.css";
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "../components/ui/button"
import { Calendar } from "../components/ui/calendar"
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

export default function IndexPage() {
  const [focusedName, setFocused] = useState(false);
  const [name, setName] = useState("");
  const floatingName = name.trim().length !== 0 || focusedName || undefined;

  const [date, setDate] = React.useState<Date>()

  const ref = useRef<HTMLInputElement>(null);

  const pickerControl = (
    <ActionIcon variant="subtle" color="gray" onClick={() => ref.current?.showPicker()}>
      <IconClock style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
    </ActionIcon>
  );

  return (
    <Stack justify="flex-start" gap={0} className={styles.container}>
      <SimpleGrid className={styles.header} cols={2}>
        <ArrowBack style={{ scale: "1.75", color: "white" }} />
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
                placeholder="Enter your name"
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
            <TimeInput label="Out Time" ref={ref} style={{color: "black"}} radius={10}/>
            <div className="grid w-full max-w-sm items-center gap-1.5 text-black">
                <Label htmlFor="picture">Upload DigiCampus</Label>
                <Input style={{ borderRadius: 10}} id="picture" type="file" />
            </div>
            <Button variant="outline" size={"lg"} color="blue" style={{ width: "100%", borderRadius: 10 }}>Submit</Button>
        </SimpleGrid>
      </Stack>

      <Box style={{ position: "fixed", bottom: 0, width: "100vw"}}>
              <Image src="../../images/vector.svg" radius="md" style={{ width: "100%", margin: 0 }} />
      </Box>
    </Stack>
  );
}
