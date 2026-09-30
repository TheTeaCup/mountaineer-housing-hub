export interface Property {
  name: string;
  slug: string;
  price: string;
  monthlyPrice: number;
  details: string;
  image: string;
  badges: string[];
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  type: string;
  available: string;
  address: string;
  description: string;
  amenities: string[];
}

export const properties: Property[] = [
  {
    name: "University Highlands",
    slug: "university-highlands",
    price: "$656",
    monthlyPrice: 656,
    details: "2 Bed • 2 Bath • AppalCART Bus Route Nearby",
    image: "/assets/properties/university-highlands.png",
    badges: ["🐾 Pet Friendly", "🅿️ Free Parking", "⭐ 4.2/5 Verified"],
    bedrooms: 2,
    bathrooms: 2,
    sqft: 900,
    type: "Apartment",
    available: "Available Now",
    address: "University Highlands, Boone, NC",
    description:
      "University Highlands offers comfortable student housing in Boone with convenient access to Appalachian State University and the AppalCART bus system. The community provides a convenient location for students looking for an affordable place to live near campus.",
    amenities: [
      "Pet friendly",
      "Free parking",
      "AppalCART nearby",
      "Washer & dryer",
      "High-speed internet",
      "Air conditioning",
      "Furnished options",
      "Near campus",
    ],
  },
  {
    name: "The Standard at Boone",
    slug: "the-standard-at-boone",
    price: "$1,050",
    monthlyPrice: 1050,
    details: "1 Bed • 1 Bath • Walking Distance to Campus",
    image: "/assets/properties/the-standard.png",
    badges: ["🐾 No Pets", "🅿️ Garage Parking", "⭐ 4.7/5 Verified"],
    bedrooms: 1,
    bathrooms: 1,
    sqft: 700,
    type: "Apartment",
    available: "Available Now",
    address: "The Standard at Boone, Boone, NC",
    description:
      "The Standard at Boone offers modern student apartments within walking distance of Appalachian State University. Residents have convenient access to campus, downtown Boone, restaurants, and other amenities.",
    amenities: [
      "Garage parking",
      "Walking distance to campus",
      "Fitness center",
      "Clubhouse",
      "AppalCART nearby",
      "Washer & dryer",
      "High-speed internet",
      "Air conditioning",
    ],
  },
  {
    name: "The Finmore at 241",
    slug: "the-finmore",
    price: "$799",
    monthlyPrice: 799,
    details: "3 Bed • 2 Bath • On-site Laundry",
    image: "/assets/properties/finmore.png",
    badges: ["🐾 Pet Friendly", "🅿️ Permit Required", "⭐ 4.3/5 Verified"],
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1100,
    type: "Apartment",
    available: "Available Now",
    address: "The Finmore at 241, Boone, NC",
    description:
      "The Finmore at 241 provides affordable student housing with spacious three-bedroom floor plans and convenient access to the Boone area. With on-site laundry and a student-friendly location, it is a practical option for Appalachian State students.",
    amenities: [
      "Pet friendly",
      "On-site laundry",
      "Permit parking",
      "High-speed internet",
      "Air conditioning",
      "Near AppalCART",
      "Student friendly",
      "Spacious floor plans",
    ],
  },
];
