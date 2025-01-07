import { Group, SimpleGrid, Stack, Button, TextInput, Textarea, Image, Box } from "@mantine/core";
import styles from "../../styles/Template.module.css";
import classes from "../../styles/Mantine/FloatingLabelInput.module.css";
import React, { useEffect, useState } from "react";
import { ArrowBack, AccountCircle } from "@material-ui/icons";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { FloorDrawer } from "../components/FloorDrawer";
import { WingDrawer } from "../components/WingDrawer";

export default function IndexPage() {
  const [date, setDate] = useState("");
  const [focusedName, setFocused] = useState(false);
  const [name, setName] = useState("");
  const floatingName = name.trim().length !== 0 || focusedName || undefined;
  const [selectedFloor, setSelectedFloor] = useState<number>(0);
  const [selectedWing, setSelectedWing] = useState<string>("");

  const [focusedRoom, setFocusedRoom] = useState(false);
  const [room, setRoom] = useState("");
  const floatingRoom = name.trim().length !== 0 || focusedRoom || undefined;
  
  useEffect(() => {
    const date_obj = new Date();
    const day = date_obj.getDate();
    const month = date_obj.getMonth() + 1;
    const year = date_obj.getFullYear();
    setDate(`${day}/${month}/${year}`);
  }, []);

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
              <BreadcrumbPage className="text-white">Maintenance Issues</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <AccountCircle style={{ scale: "1.75", color: "white" }} />
      </SimpleGrid>

      <Group className={styles.bottom}>
        <SimpleGrid cols={1} style={{ width: "80%" }} spacing="3rem">
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
            <FloorDrawer 
              selectedFloor={selectedFloor}
              setSelectedFloor={setSelectedFloor}
            />
            <WingDrawer 
              selectedWing={selectedWing}
              setSelectedWing={setSelectedWing}
            />
            <TextInput
                label="Room Number"
                placeholder="Enter your Room Number"
                required
                classNames={classes}
                value={room}
                onChange={(event) => setRoom(event.currentTarget.value)}
                onFocus={() => setFocusedRoom(true)}
                onBlur={() => setFocusedRoom(false)}
                autoComplete="nope"
                data-floating={floatingRoom}
                labelProps={{ 'data-floating': floatingRoom }}
                radius={10}
            />

            <Textarea
              label="Issue Description"
              placeholder="Brief your issue here..."
              autosize
              minRows={4}
              maxRows={4}
              style={{ color: "black" }}
              radius={10}
            />
            <Stack justify="centre" style={{ width: "100%", display: "flex", alignItems: "center" }} gap="xl">
              <Button variant="outline" color="blue" style={{ width: "100%", borderRadius: 10 }}>
                Submit
              </Button>
              <Button variant="outline" color="blue" style={{ width: "50%", borderRadius: 10 }}>
                Issues History
              </Button>
            </Stack>
        </SimpleGrid>
      </Group>
      <Box style={{ position: "fixed", bottom: 0, width: "100vw"}}>
        <Image src="../../images/vector.svg" radius="md" style={{ width: "100%", margin: 0 }} />
      </Box>
    </Stack>
  );
}
