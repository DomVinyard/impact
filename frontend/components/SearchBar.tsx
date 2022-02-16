import { SearchIcon } from "@chakra-ui/icons";
import {
  InputGroup,
  InputLeftElement,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useSearchOrgsLazyQuery } from "generated-graphql";
import React from "react";
import { AsyncSelect } from "chakra-react-select";

export const SearchBar = ({
  value,
  onChange,
  mini,
  onFocus,
  onBlur,
  isSearchFocusMobile,
}: any) => {
  const [searchOrgs] = useSearchOrgsLazyQuery({ fetchPolicy: "network-only" });
  const isMobile = useBreakpointValue({ base: true, md: false });

  const getAsyncOptions = async (inputValue) => {
    const { data, error } = await searchOrgs({
      variables: { q: `%${inputValue}%` },
    });
    if (error) return await [];
    return await [
      {
        label: `Search for "${inputValue}"`,
        value: "@search",
      },
      ...data?.orgs?.map((org) => ({
        label: org.name,
        value: org.slug,
      })),
    ];
  };
  return (
    <InputGroup
      alignSelf={{ base: "center", md: "left" }}
      maxW={{ base: 400, md: 800 }}
      margin={{ base: "auto", md: 0 }}
    >
      {!mini && (
        <InputLeftElement
          pointerEvents="none"
          top={1}
          children={<SearchIcon color="gray.300" />}
        />
      )}
      <AsyncSelect
        defaultInputValue={value}
        tagVariant={mini ? "solid" : "outline"}
        onChange={(option) => {
          if (option.value === "@search") {
            location.href = `/search?q=${value}`;
          } else {
            location.href = `/${option.value}`;
          }
        }}
        onInputChange={(inputValue) => {
          onChange(inputValue);
        }}
        loadOptions={(inputValue) => {
          onChange(inputValue);
          return getAsyncOptions(inputValue);
        }}
        components={{
          DropdownIndicator: () => null,
          IndicatorSeparator: () => null,
        }}
        chakraStyles={{
          input: (provided) => ({
            width: "100%",
            background: "none",
            marginLeft: mini ? 0 : "1.5rem",
            outline: "none",
            type: "search",
            enterKeyHint: "search",
            role: "search",
          }),
          inputContainer: (provided) => ({
            width: "100%",
            maxW: "440px",
            marginLeft: mini ? 0 : 0,
          }),
          container: (provided) => ({
            width: "100%",
            maxWidth: 440,
            marginLeft: mini ? 2 : 0,
            border: mini ? "0px solid rgba(0,0,0,0) !important" : "auto",
            background: mini ? "rgb(67, 58, 87) !important" : "auto",
          }),
          placeholder: (provided) => ({
            ...provided,
            marginLeft: mini ? 0 : "1.5rem",
          }),
          menu: (provided) => ({
            ...provided,
            width: "100%",
            maxW: "440px",
            color: "black",
            display: !value?.length ? "none" : "block",
          }),
        }}
        size={mini ? "sm" : "lg"}
        placeholder={
          mini || (isMobile && isSearchFocusMobile)
            ? "Search"
            : "Search charity or organisation"
        }
        autoFocus={!mini && !isMobile}
        value={value}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </InputGroup>
  );
};

export default SearchBar;