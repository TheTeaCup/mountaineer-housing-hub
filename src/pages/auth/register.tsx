import { Box } from "@chakra-ui/react";
import NavBar from "../../components/navigation/navbar";
export default function AuthRegister() {
  return (
    <Box
      minH="100vh"
      bg="#f8f9fa"
      color="#333"
      fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
    >
      {/* Header */}
      <NavBar />
    </Box>
  );
}
