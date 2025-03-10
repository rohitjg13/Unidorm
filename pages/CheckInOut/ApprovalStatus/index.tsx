import { Group, SimpleGrid, Stack, Text, Divider, Box, Image } from "@mantine/core";
import styles from "../../../styles/Template.module.css";
import React from "react";
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
  const requestData = [
    {
      title: "Check In Request",
      date: "24/11/2025",
      status: "Awaited Approval"
    },
    {
      title: "Check Out Request",
      date: "24/11/2025",
      status: "Awaited Approval"
    },
    {
      title: "Check Out Request",
      date: "24/11/2025",
      status: "Awaited Approval"
    }
  ];

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
              <BreadcrumbPage className="text-white">Approval Status</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <AccountCircle style={{ scale: "1.75", color: "white" }} />
      </SimpleGrid>

      <Group className={styles.bottom}>
      {requestData.map((request, index) => (
            <Stack 
                key={index}
                gap={"sm"} 
                style={{ 
                    padding: "0.75rem", 
                    width: "90%", 
                    borderRadius: "0.5rem", 
                    borderWidth: "1px", 
                    borderColor: "rgba(0, 0, 0, 0.125)", 
                    borderStyle: "solid" 
                }}
            >
                <Text style={{ color: "black", fontSize: "1rem" }}>{request.title}</Text>
                <Stack gap={"0.4rem"}>
                <Text style={{ color: "black", opacity: 0.5, fontSize: "0.8rem" }}>
                    {request.date}
                </Text>
                <Divider />
                <Text style={{ color: "black", opacity: 0.5, fontSize: "0.8rem" }}>
                    Status: {request.status}
                </Text>
                </Stack>
            </Stack>
      ))}
      </Group>
      <Box style={{ position: "fixed", bottom: 0, width: "100vw"}}>
              <Image src="../../images/vector.svg" radius="md" style={{ width: "100%", margin: 0 }} alt=""/>
      </Box>
    </Stack>
  );
}
