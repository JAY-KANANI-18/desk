import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const { data } = await supabase.auth.getSession();
      
        localStorage.setItem("invite_process", JSON.stringify(data));
        
    //   if (data.session) {
    //     navigate("/dashboard");
    //   } else {
    //     navigate("/login");
    //   }
    };

    handleAuth();
  }, []);

  return <div>Signing you in...</div>;
}