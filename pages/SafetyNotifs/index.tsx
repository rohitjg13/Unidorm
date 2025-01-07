import { Group, SimpleGrid, Stack, Button, Text, TextInput, Textarea, Image, Box } from "@mantine/core";
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
export default function IndexPage() {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");

  useEffect(() => {
    const date_obj = new Date();
    const day = date_obj.getDate();
    var month = date_obj.getMonth() + 1;
    // make the month to letters like JAN, FEB
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    month = monthNames[date_obj.getMonth()];
    setDay(`${day}`);
    setMonth(`${month}`);
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
        <SimpleGrid cols={1} style={{ width: "80%" }} spacing="3rem">
            <SimpleGrid cols={1} style={{ width: "100%" }} spacing="0rem">
                <Box >
                    
                <Text style={{fontFamily: "monospace", fontSize: "2rem", fontWeight: "bold", color: "black"}}>{day}</Text>
                <Text style={{fontFamily: "monospace", fontSize: "10.75rem", color: "black"}}>{month}</Text>

                </Box>
            </SimpleGrid>
        </SimpleGrid>
      </Group>
    </Stack>
  );
}
