"use client";

import SEO from "@/components/seo";
import ReviewForm from "@/components/submissions/review-form";
import { Box, Container } from "@chakra-ui/react";
import { useState } from "react";
import NavBar from "../components/navigation/navbar";
import ApartmentForm from "../components/submissions/apartment-form";

export default function Submit() {
  const [showApartmentForm, setShowApartmentForm] = useState(false);

  return (
    <>
      <SEO title="Submit" />

      <Box
        minH="100vh"
        bg="#f8f9fa"
        color="#333"
        fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      >
        <NavBar />

        <Container maxW="800px" py={10}>
          {showApartmentForm ? (
            <ApartmentForm onBack={() => setShowApartmentForm(false)} />
          ) : (
            <ReviewForm onSubmitApartment={() => setShowApartmentForm(true)} />
          )}
        </Container>
      </Box>
    </>
  );
}
