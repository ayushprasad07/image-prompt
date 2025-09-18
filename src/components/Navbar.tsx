// "use client";
// import {
//   Navbar,
//   NavBody,
//   NavItems,
//   MobileNav,
//   NavbarLogo,
//   NavbarButton,
//   MobileNavHeader,
//   MobileNavToggle,
//   MobileNavMenu,
// } from "@/components/ui/resizable-navbar";
// import { signOut } from "next-auth/react";
// import { useState } from "react";
// import { CreateWorkModal } from "./CreateWorkModal";

// export function NavbarDemo() {

//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

//     const handleLogout = ()=>{
//         signOut({ callbackUrl: "/sign-in" });
//     }

//   return (
//     <div className="relative w-full">
//       <Navbar>
//         <NavBody>
//           <NavbarLogo />
//           <div className="flex items-center gap-4">
//             <NavbarButton variant="secondary" onClick={handleLogout}>Logout</NavbarButton>
//             <div><CreateWorkModal></CreateWorkModal></div>
//           </div>
//         </NavBody>

//         <MobileNav>
//           <MobileNavHeader>
//             <NavbarLogo />
//             <MobileNavToggle
//               isOpen={isMobileMenuOpen}
//               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//             />
//           </MobileNavHeader>
//           <MobileNavMenu
//             isOpen={isMobileMenuOpen}
//             onClose={() => setIsMobileMenuOpen(false)}
//           >
            
//             <div className="flex w-full flex-col gap-4">
//               <NavbarButton
//                 onClick={() => setIsMobileMenuOpen(false)}
//                 variant="primary"
//                 className="w-full"
//               >
//                 Login
//               </NavbarButton>
//               <NavbarButton
//                 onClick={() => setIsMobileMenuOpen(false)}
//                 variant="primary"
//                 className="w-full"
//               >
//                 Book a call
//               </NavbarButton>
//             </div>
//           </MobileNavMenu>
//         </MobileNav>
//       </Navbar>

//       {/* Navbar */}
//     </div>
//   );
// }


"use client";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState } from "react";
import { CreateWorkModal } from "./CreateWorkModal";
import { signOut } from "next-auth/react";

export function NavbarDemo() {
  // const navItems = [
  //   {
  //     name: "Features",
  //     link: "#features",
  //   },
  //   {
  //     name: "Pricing",
  //     link: "#pricing",
  //   },
  //   {
  //     name: "Contact",
  //     link: "#contact",
  //   },
  // ];

  const handleLogout = ()=>{
         signOut({ callbackUrl: "/sign-in" });
     }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative w-full">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          {/* <NavItems items={navItems} /> */}
          <div className="flex items-center gap-4">
            <NavbarButton variant="secondary" onClick={handleLogout}>Sign out</NavbarButton>
            {/* <NavbarButton variant="primary">Book a call</NavbarButton> */}
            <div><CreateWorkModal></CreateWorkModal></div>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {/* {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300"
              >
                <span className="block">{item.name}</span>
              </a>
            ))} */}
            <div className="flex w-full flex-col gap-4">
              <NavbarButton
                // onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full"
                onClick={handleLogout}
              >
                Sign out
              </NavbarButton>
              <div
                onClick={() => setIsMobileMenuOpen(false)}
                // variant="primary"
                className="w-full"
              >
                <CreateWorkModal></CreateWorkModal>
              </div>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Navbar */}
    </div>
  );
}

