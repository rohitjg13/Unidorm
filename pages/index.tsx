import { Button, Group, SimpleGrid, Stack, UnstyledButton, Text } from "@mantine/core";
import styles from "../styles/Home.module.css";
import React, { useEffect, useState } from "react";
import { Home, Announcement, Report, Contacts, Settings, Forum, ErrorOutline, Notifications } from "@material-ui/icons";
export default function IndexPage() {
  const [date, setDate] = useState("");

  useEffect(() => {
    const date_obj = new Date();
    const day = date_obj.getDate();
    const month = date_obj.getMonth() + 1;
    const year = date_obj.getFullYear();
    setDate(`${day}/${month}/${year}`);
  }, []);

  return (
    <Stack justify="flex-start" gap={0} className={styles.container}>
      <Group className={styles.header}>
        <SimpleGrid cols={2}>
          <UnstyledButton className={styles.topButton}>
            <Notifications style={{ scale: "1.75", color: "black" }} />
            <Text className={styles.topButtonText}>{date}</Text>
            <Text style={{ color: "black", opacity: 0.5, fontSize: "0.5rem" }}>Safety Notifications</Text>
          </UnstyledButton>
          <UnstyledButton className={styles.topButton}>
            <ErrorOutline style={{ scale: "1.75", color: "red" }} />
            <Text className={styles.topButtonText}>SOS</Text>
            <Text style={{ color: "black", opacity: 0.5, fontSize: "0.75rem" }}>Emergencies Only</Text>
          </UnstyledButton>
        </SimpleGrid>
      </Group>
    
      <Group className={styles.bottom}>
        <SimpleGrid cols={{ base: 2, sm: 2, lg: 3 }}>
          <UnstyledButton className={styles.button}>
            <Settings style={{ scale: "1.5" }} />
            <Text className={styles.buttonText}>Manufacturing</Text>
          </UnstyledButton>
          <UnstyledButton className={styles.button}>
            <Contacts style={{ scale: "1.5" }} />
            <Text className={styles.buttonText}>Contacts</Text>
          </UnstyledButton>
          <UnstyledButton className={styles.button}>
            <Announcement style={{ scale: "1.5" }} />
            <Text className={styles.buttonText}>Announcements</Text>
          </UnstyledButton>
          <UnstyledButton className={styles.button}>
            <Report style={{ scale: "1.5" }} />
            <Text className={styles.buttonText}>Annonymous Reporting</Text>
          </UnstyledButton>
          <UnstyledButton className={styles.button}>
            <Home style={{ scale: "1.5" }} />
            <Text className={styles.buttonText}>Check In/Out</Text>
          </UnstyledButton>
          <UnstyledButton className={styles.button}>
            <Forum style={{ scale: "1.5" }} />
            <Text className={styles.buttonText}>Open Forum</Text>
          </UnstyledButton>
        </SimpleGrid>
      </Group>
    </Stack>
  );
}
