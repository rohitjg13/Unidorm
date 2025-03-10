import { Group, SimpleGrid, Stack, Button, Text, Divider, Box, Image } from "@mantine/core";
import styles from "../../styles/Template.module.css";
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
import { Schedule } from "@material-ui/icons";

export default function IndexPage() {
  const notifications = [
    {
      day: "15",
      month: "MAR",
      title: "Fire Alarm Test",
      description: "Regular monthly fire alarm testing",
      time: "10:00"
    },
    {
      day: "16",
      month: "MAR",
      title: "Maintenance Check",
      description: "Regular safety equipment inspection",
      time: "14:30"
    }
  ];

  useEffect(() => {
    const date_obj = new Date();
    const day = date_obj.getDate();
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
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
              <BreadcrumbPage className="text-white">Safety Notifications</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <AccountCircle style={{ scale: "1.75", color: "white" }} />
      </SimpleGrid>

      <Group className={styles.bottom}>
        {notifications.map((notif, index) => (
            <Box key={index}>
                <Box style={{ width: "90vw", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Stack justify="flex-start" style={{ width: "10%", display: "flex", alignItems: "center" }} gap="0">
                        <Text style={{fontFamily: "monospace", fontSize: "1.5rem", fontWeight: "bold", color: "black"}}>
                        {notif.day}
                        </Text>
                        <Text style={{fontFamily: "monospace", fontSize: "0.7rem", color: "black"}}>
                        {notif.month}
                        </Text>
                    </Stack>
                    <Stack justify="flex-start" style={{ width: "67.5%", display: "flex", alignItems: "start", paddingLeft: "1rem" }} gap="0">
                        <Text style={{ fontSize: "1rem", fontWeight: "bold", color: "black"}}>
                        {notif.title}
                        </Text>
                        <Text style={{ fontSize: "0.75rem", color: "black"}}>
                        {notif.description}
                        </Text>
                    </Stack>
                    <Box style={{ width: "22.5%", display: "flex", alignItems: "center", justifyContent: "flex-start", paddingRight: "1rem" }}>
                        <Schedule style={{ scale: "0.6", color: "black" }} />
                        <Text style={{fontFamily: "monospace", fontSize: "0.8rem", color: "black", width:"20%"}}>
                        {notif.time}
                        </Text>
                    </Box>
                </Box>
                <Divider my="sm" style={{marginBottom: "0rem"}} />
            </Box>
        ))}
      </Group>
      <Box style={{ position: "fixed", bottom: 0, width: "100vw"}}>
              <Image src="../../images/vector.svg" radius="md" style={{ width: "100%", margin: 0 }} alt="" />
      </Box>
    </Stack>
  );
}
