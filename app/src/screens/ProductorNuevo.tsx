import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/ui";
import { ClienteForm } from "../components/cliente-form";

export function ProductorNuevo() {
  const navigate = useNavigate();
  return (
    <div className="screen">
      <TopBar title="Nuevo productor" />
      <div className="no-scrollbar fade-in flex-1 overflow-y-auto px-5 pb-6">
        <ClienteForm onSaved={() => navigate("/productores")} />
      </div>
    </div>
  );
}
