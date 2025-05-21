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
  email: z.string().email(),
  password: z.string().min(1),
});

const Login = () => {
  const navigate = useNavigate();
  const userStore = useUserStore();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: Endpoints.auth.login().request,
    onSuccess: (res) => {
      userStore.setUser(res);
      navigate("/");
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Invalid email or password",
      }),
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    mutation.mutate(data);
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md p-6 md:p-8">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold">Login to smatter</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Enter account details to continue
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-2">
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
                Sign in
              </LoadingButton>

              <CardDescription className="text-gray-500 dark:text-gray-400">
                Not signed up yet?{" "}
                <Link to="/register" className="text-blue-500">
                  Register
                </Link>
              </CardDescription>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
