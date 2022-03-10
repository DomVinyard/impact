import {
  Alert,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  ButtonGroup,
  CloseButton,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Stack,
  useBreakpointValue,
} from "@chakra-ui/react";
import AccessDeniedIndicator from "components/AccessDeniedIndicator";
import {
  useDeleteOrgMutation,
  useInsertOrgMutation,
  useUpdateImpactPriorityMutation,
  useUpdateOrgMutation,
} from "generated-graphql";
import { useSession } from "next-auth/client";
import React, { useEffect, useState } from "react";
import Content from "components/Content";
import { useFetchOrgQuery } from "generated-graphql";
import router, { useRouter } from "next/router";
import { DeleteIcon } from "@chakra-ui/icons";
import slugify from "../../lib/slugify";
import Loader from "components/Loader";
import { useForm } from "react-hook-form";
import FIELDS from "./AddEditOrg.form";

const AddEditOrgForm = ({ org, refetch, isLoading }) => {
  console.log("initial", org);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm({
    defaultValues: {
      ...org,
    },
  });

  const [updateImpactPriority, { error, loading }] =
    useUpdateImpactPriorityMutation();
  useEffect(() => !isLoading && reset(org), [isLoading]);
  const values = watch();
  // const [isSubmitted, setIsSubmitted] = useState("");
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [session] = useSession();
  const isEditMode = !!org;
  console.log({ values });

  const [insertOrg, { loading: insertOrgFetching, error: insertOrgError }] =
    useInsertOrgMutation();
  const [updateOrg, { loading: updateOrgFetching, error: updateOrgError }] =
    useUpdateOrgMutation();
  const [deleteOrg, { loading: deleteOrgFetching, error: deleteOrgError }] =
    useDeleteOrgMutation({ variables: { id: org?.id } });

  if (!session) return <AccessDeniedIndicator message="Please sign in" />;

  const isUpdating =
    insertOrgFetching || updateOrgFetching || deleteOrgFetching;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this org?")) return;
    // setIsSubmitted("deleting");
    await deleteOrg();
    router.push(`/orgs`);
  };

  const onSubmit = async (values) => {
    values.slug = slugify(values.name);
    // setIsSubmitted(isEditMode ? "Updating report" : "Creating report");
    try {
      if (isEditMode) {
        await updateOrg({ variables: { id: org.id, ...values } });

        values.impacts.forEach(async (item, index) => {
          // set the index in the db
          const variables = { impactID: item.id, priority: index };
          try {
            console.log({ variables });
            updateImpactPriority({ variables });
          } catch (error) {
            console.error(error);
          }
        });
      } else {
        await insertOrg({ variables: { author_id: session.id, ...values } });
      }
    } catch (e) {
      console.log(e);
    }

    router.push(`/${values.slug}`);
  };

  const errorNode = () => {
    if (!insertOrgError) return false;
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>{insertOrgError}</AlertTitle>
        <CloseButton position="absolute" right="8px" top="8px" />
      </Alert>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={4}>
        {errorNode()}
        <Box maxW={760}>
          <Stack spacing={4} my={12}>
            {/* Fields */}
            {FIELDS?.map((field) => (
              <Box paddingBottom={8}>
                <FormControl isInvalid={errors[field.id]}>
                  {field.before && (
                    <field.before values={values} isEditMode={isEditMode} />
                  )}
                  <FormLabel
                    style={{ fontSize: 22 }}
                    htmlFor={errors[field.id]}
                  >
                    {field.label}
                  </FormLabel>
                  {field.custom ? (
                    <field.custom
                      id={field.id}
                      values={values}
                      isEditMode={isEditMode}
                      org={org}
                      refetch={refetch}
                      {...register(field.id, field.validation)}
                    />
                  ) : (
                    <field.element
                      autoComplate="off"
                      id={field.id}
                      placeholder={field.placeholder}
                      {...register(field.id, field.validation)}
                    />
                  )}
                  <FormErrorMessage>
                    {errors[field.id] && errors[field.id].message}
                  </FormErrorMessage>
                  {field.after && (
                    <field.after values={values} isEditMode={isEditMode} />
                  )}
                </FormControl>
              </Box>
            ))}

            {isEditMode && (
              <Button
                marginRight={"auto"}
                colorScheme="red"
                variant="outline"
                leftIcon={<DeleteIcon />}
                onClick={handleDelete}
              >
                Delete{!isMobile && " Organisation"}
              </Button>
            )}
          </Stack>
        </Box>
      </Stack>
      {/* Buttons */}
      <FormControl
        position="fixed"
        zIndex={1}
        background={"black"}
        left={0}
        top={{ base: 0, md: "auto" }}
        bottom={{ base: "auto", md: 0 }}
        p={6}
      >
        <Content isFull>
          <Flex
            maxW={760}
            justifyContent={isDirty ? "flex-end" : "space-between"}
          >
            <Button
              variant={isDirty ? "outline" : "ghost"}
              padding={isDirty ? 4 : 0}
              colorScheme="gray"
              color={"gray"}
              onClick={() => router.back()}
            >
              {isDirty ? "Cancel" : `← Back to ${values.name}`}
            </Button>
            <Button
              loadingText="Saving..."
              colorScheme={"gray"}
              minW={150}
              onClick={handleSubmit}
              isLoading={isSubmitting}
              isDisabled={isValid && !isDirty}
              type={"submit"}
              ml={3}
            >
              {isEditMode ? "Save" : "Add"}
            </Button>
          </Flex>
        </Content>
      </FormControl>
    </form>
  );
};

const AddEditOrgPage = () => {
  const router = useRouter();
  const { data, error, loading, refetch } = useFetchOrgQuery({
    variables: { slug: `${router?.query.slug}` },
  });
  const [org] = data?.orgs || [];
  return (
    <Content>
      <AddEditOrgForm org={org} refetch={refetch} isLoading={loading} />
    </Content>
  );
};

export default AddEditOrgPage;
