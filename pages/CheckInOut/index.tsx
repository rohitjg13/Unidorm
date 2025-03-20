import { Group, SimpleGrid, Stack, UnstyledButton, Text, Box, Image, Button } from "@mantine/core";
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
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

export default function IndexPage() {
    const buttonStyle = {
         width: "calc(50vw - 4rem)", 
         height: "calc(50vw - 4rem)", 
         borderRadius: "1rem", 
         backgroundColor: "#f5f5f5", 
         color: "black", 
         display: "flex", 
         justifyContent: "center", 
         alignItems: "center",
         boxShadow: "0px 1px 15px 0px rgba(0,0,0,0.5)"
    };

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
              <BreadcrumbPage className="text-white">Check In / Check Out</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <AccountCircle style={{ scale: "1.75", color: "white" }} />
      </SimpleGrid>

      <Stack className={styles.bottom}>
        <Group style={{ display: "flex", flexDirection: "column", justifyContent: "centre", alignItems: "center", height: "85vh", position: "relative" }}>
            <Stack gap={"6rem"} style={{ display: "flex", flexDirection: "column", justifyContent: "spece-between", alignItems: "center", height: "100%" }}>
                <Group style={{ width: "100vw", display: "flex", alignItems: "center", justifyContent: "space-evenly" }}>
                    <UnstyledButton style={buttonStyle}>
                        <SimpleGrid cols={1} style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                            <LoginIcon style={{ scale: "2.25", color: "#3f6cd4" }} />
                            <Text style={{ color: "#3f6cd4", fontSize: "1.25rem" }}>Check In</Text>
                        </SimpleGrid>
                    </UnstyledButton>
                    <UnstyledButton style={buttonStyle}>
                        <SimpleGrid cols={1} style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                            <LogoutIcon style={{ scale: "2.25", color: "#3f6cd4" }} />
                            <Text style={{ color: "#3f6cd4", fontSize: "1.25rem" }}>Check Out</Text>
                        </SimpleGrid>
                    </UnstyledButton>
                </Group>
                <Button variant="outline" color="blue" size="xl" style={{ width: "80%", borderRadius: 10 }}>Approval Status</Button>
            </Stack>
        </Group>
      </Stack>

      <Box className={styles.vectorBackground}>
        <Image src="../../images/vector.svg" radius="md" style={{ width: "100%", margin: 0 }} alt="" />
      </Box>
    </Stack>
  );
}
