import { Group, SimpleGrid, Stack, Text, Divider, Box, Image } from "@mantine/core";
import styles from "../../styles/Template.module.css";
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
  const staffData = [
    {
      name: "Warden",
      timing: "No Specific Timing",
      phone: "+91 98765 43210"
    },
    {
      name: "Jane Smith",
      timing: "2:00 PM - 10:00 PM",
      phone: "+91 98765 43210"
    },
    {
      name: "Mike Johnson",
      timing: "10:00 PM - 6:00 AM",
      phone: "+91 98765 43210"
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
              <BreadcrumbPage className="text-white">Information</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <AccountCircle style={{ scale: "1.75", color: "white" }} />
      </SimpleGrid>

      <Group className={styles.bottom}>
      {staffData.map((staff, index) => (
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
                <Text style={{ color: "black", fontSize: "1rem" }}>{staff.name}</Text>
                <Stack gap={"0.4rem"}>
                <Text style={{ color: "black", opacity: 0.5, fontSize: "0.8rem" }}>
                    {staff.timing}
                </Text>
                <Divider />
                <Text style={{ color: "black", opacity: 0.5, fontSize: "0.8rem" }}>
                    Phone Number: {staff.phone}
                </Text>
                </Stack>
            </Stack>
      ))}
      </Group>
      <Box style={{ position: "fixed", bottom: 0, width: "100vw"}}>
              <Image src="../../images/vector.svg" radius="md" style={{ width: "100%", margin: 0 }} alt="" />
      </Box>
    </Stack>
  );
}
