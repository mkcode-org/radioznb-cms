"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-form-field"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", localStorage.getItem("flow") ?? "signIn");
          void signIn("password", formData).catch((error) => {
            let toastTitle = "";
            if (error.message.includes("Invalid password")) {
              toastTitle = "неверный пароль";
            } else {
              toastTitle = "не получилось авторизовать";
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="email"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="пароль"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          войти
        </button>
        <div className="text-center text-sm text-secondary"></div>
      </form>
    </div>
  );
}
