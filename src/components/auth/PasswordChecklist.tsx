import { Check, X } from "lucide-react";
import { PasswordRequirements } from "@/lib/passwordValidation";

interface PasswordChecklistProps {
  requirements: PasswordRequirements;
}

const PasswordChecklist = ({ requirements }: PasswordChecklistProps) => {
  const items = [
    { key: "minLength", label: "At least 10 characters", met: requirements.minLength },
    { key: "hasUppercase", label: "Uppercase letter (A–Z)", met: requirements.hasUppercase },
    { key: "hasLowercase", label: "Lowercase letter (a–z)", met: requirements.hasLowercase },
    { key: "hasNumber", label: "Number (0–9)", met: requirements.hasNumber },
    { key: "hasSpecialChar", label: "Special character (!@#$%^&*)", met: requirements.hasSpecialChar },
  ];

  const metCount = items.filter((item) => item.met).length;
  const strengthPercent = (metCount / items.length) * 100;

  const getStrengthLabel = () => {
    if (metCount === 0) return { label: "", color: "bg-muted" };
    if (metCount <= 2) return { label: "Weak", color: "bg-red-500" };
    if (metCount <= 4) return { label: "Medium", color: "bg-yellow-500" };
    return { label: "Strong", color: "bg-green-500" };
  };

  const strength = getStrengthLabel();

  return (
    <div className="mt-3 space-y-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={`font-medium ${metCount === 5 ? "text-green-500" : metCount >= 3 ? "text-yellow-500" : "text-red-500"}`}>
            {strength.label}
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${strength.color}`}
            style={{ width: `${strengthPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <ul className="space-y-1 text-sm">
        {items.map((item) => (
          <li
            key={item.key}
            className={`flex items-center gap-2 transition-colors ${
              item.met ? "text-green-500" : "text-muted-foreground"
            }`}
          >
            {item.met ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordChecklist;
