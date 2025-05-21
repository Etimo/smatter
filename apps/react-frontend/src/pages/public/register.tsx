import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Endpoints } from "../../api/api";
import { LoadingButton } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { toast } from "../../components/ui/use-toast";
import { useUserStore } from "../../stores/user-store";

const FormSchema = z.object({
  username: z.string().min(3, "Username must be atleast 3 characters long"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be atleast 6 characters long"),

});

const Register = () => {
  const userStore = useUserStore();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: Endpoints.auth.signup().request,
    onSuccess: (res) => {
      userStore.setUser(res);
      navigate("/");
      toast({
        description: "🚀🚀🚀",
        title: "Signup successful!",
      });
    },
    onError: (error) => {
      toast({
        description: error.message,
        title: "Error",
      });
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    mutation.mutate({...data, displayName: data.username});
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md p-6 md:p-8">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold">
            Sign up to smatter
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Enter account details to continue
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-2">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="funkmasta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="hello@world.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="block space-y-4">
              <LoadingButton
                type="submit"
                loading={mutation.isPending}
                className="w-full"
              >
                Register
              </LoadingButton>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Already signed up?{" "}
                <Link to="/login" className="text-blue-500">
                  Login
                </Link>
              </CardDescription>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
