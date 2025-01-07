import { Group, SimpleGrid, Stack, Button, Textarea } from "@mantine/core";
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
              <BreadcrumbPage className="text-white">Anonymous Reporting</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <AccountCircle style={{ scale: "1.75", color: "white" }} />
      </SimpleGrid>

      <Group className={styles.bottom}>
        <SimpleGrid cols={1} style={{ width: "80%" }} spacing="3rem">
            
            <Textarea
                label="Issue Description"
                placeholder="Brief your issue here..."
                autosize
                minRows={4}
                maxRows={4}
                style={{ color: "black" }}
                radius={10}
            />
            <Button variant="outline" color="blue" style={{ width: "100%", borderRadius: 10 }}>
                Submit
            </Button>
        </SimpleGrid>
      </Group>
    </Stack>
  );
}
