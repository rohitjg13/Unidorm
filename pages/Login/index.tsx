import {
  Group,
  SimpleGrid,
  Stack,
  Button,
  Textarea,
  Box,
  Image,
  UnstyledButton,
  Text
} from "@mantine/core";
import styles from "../../styles/Template.module.css";
import React, { useEffect, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { LocalLaundryService, Restaurant } from "@material-ui/icons";
import GoogleIcon from '@mui/icons-material/Google';

const carouselItems = [
  {
    icon: <LocalLaundryService style={{ fontSize: "4rem", color: "#4F46E5" }} />,
    text: "Laundry",
    gradient: "from-blue-50 to-indigo-50"
  },
  {
    icon: <Restaurant style={{ fontSize: "4rem", color: "#E11D48" }} />,
    text: "Mess Menu",
    gradient: "from-red-50 to-pink-50"
  }
];

export default function IndexPage() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  return (
    <Stack justify="flex-start" gap={0} className={styles.container}>
      {/* <SimpleGrid className={styles.header} cols={2}>
        
      </SimpleGrid> */}

      <Group style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", height: "100vh", position: "relative", backgroundColor: "#fff" }}>
        <Text style={{ fontSize: "3rem", fontWeight: "bold"}}>App Name</Text>
        <Group style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", position: "relative", backgroundColor: "#fff" }}>
            <Carousel
            plugins={[plugin.current]}
            style={{ width: "85%" }}
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
            >
            <CarouselContent style={{ height: "100%" }}>
                {carouselItems.map((item, index) => (
                <CarouselItem key={index}>
                    <div className="p-4">
                    <Card className={`
                        bg-gradient-to-br ${item.gradient}
                        transform transition-all duration-300 ease-in-out
                        hover:scale-105 hover:shadow-xl
                        cursor-pointer
                    `}
                    style={{ boxShadow: "0px 1px 15px 0px rgba(0,0,0,0.5)" }}
                    >
                        <CardContent 
                        className="flex flex-col items-center justify-center p-8" 
                        style={{ 
                            height: "60vh",
                            gap: "2rem",
                            background: "rgba(255, 255, 255, 0.7)",
                            backdropFilter: "blur(10px)",
                            borderRadius: "1rem"
                        }}
                        >
                        <div className="transform transition-all duration-300 hover:scale-110">
                            {item.icon}
                        </div>
                        <span className="text-2xl font-semibold text-center tracking-wide text-gray-800">
                            {item.text}
                        </span>
                        </CardContent>
                    </Card>
                    </div>
                </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
            </Carousel>

            <UnstyledButton
            style={{
            backgroundColor: "#000",
            color: "#fff",
            padding: "0.75rem 2rem",
            marginTop: "2rem",
            borderRadius: "0.5rem",
            fontSize: "1rem",
            transition: "all 0.3s ease",
            }}
            className="hover:opacity-90"
        >
            <GoogleIcon style={{ marginRight: "1rem" }} />
            Login with Google
        </UnstyledButton>
      </Group>
      </Group>
      
    </Stack>
  );
}
