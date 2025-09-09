"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import { Dela_Gothic_One } from 'next/font/google'
import AlertForm from '@/components/Alert';
import ListingCard from '@/components/ListingCard';

import { Input, Field, Button, Select, Disclosure, DisclosureButton, DisclosurePanel, Switch } from '@headlessui/react';
import clsx from 'clsx';

type Listing = {
  title: string;
  link: string;
  location: string;
  datePosted: string;
  company: string;
  salary: string;
  jobType: string;
};

type FilterKey = keyof Pick<Listing, 'title' | 'company' | 'location'>;

const delaGothicOne = Dela_Gothic_One({
  weight: ['400'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
})

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filtered, setFiltered] = useState<Listing[]>([]);
  const [displayedListings, setDisplayedListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("company");
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const [isFaang, setIsFaang] = useState(false);
  const [jobType, setJobType] = useState("both");

  const topTechCompanies = [
    "Apple", "Microsoft", "Nvidia", "TikTok", "Alphabet", "Amazon", "Meta", "Taiwan Semiconductor Manufacturing Company (TSMC)", "Broadcom", "Tesla", "Tencent",
    "Samsung Electronics", "ASML", "Google", "Oracle", "Adobe", "Salesforce", "Cisco", "IBM", "Intel", "Shopify", "SAP",
    "Accenture", "Qualcomm", "AMD", "ServiceNow", "Intuit", "Snowflake", "Workday", "Square", "Spotify", "Zoom",
    "Palantir", "Dropbox", "Atlassian", "Twilio", "Datadog", "CrowdStrike", "Okta", "Zscaler", "DocuSign", "RingCentral",
    "Slack Technologies", "Pinterest", "Snap", "Uber", "Lyft", "Airbnb", "DoorDash", "Robinhood", "Coinbase", "Stripe",
    "SpaceX", "Epic Games", "ByteDance", "Didi Chuxing", "Xiaomi", "Meituan", "JD.com", "Baidu", "Alibaba", "Huawei",
    "Sony", "LG Electronics", "Panasonic", "Toshiba", "Fujitsu", "NEC Corporation", "Hitachi", "Nokia", "Ericsson", "Siemens",
    "Philips", "SAP", "Capgemini", "Infosys", "Wipro", "Tata Consultancy Services", "HCL Technologies", "Tech Mahindra", "Cognizant", "DXC Technology",
    "HP", "Dell Technologies", "Lenovo", "Acer", "Asus", "Micron Technology", "Western Digital", "Seagate Technology", "NetApp", "VMware",
    "Red Hat", "Citrix Systems", "Fortinet", "Palo Alto Networks", "Check Point Software", "Trend Micro", "Kaspersky Lab", "McAfee", "Symantec", "NortonLifeLock"
  ];

  const handleJobTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setJobType(event.target.value);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as FilterKey;
    setFilter(value);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/fetchJobs');
        const data = await response.json();
        setListings(data.listings);
        setFiltered(data.listings);
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    let filteredListings = listings.filter((listing) => {
      const filterValue = listing[filter].toLowerCase();
      const searchValue = search.toLowerCase();
      return filterValue.includes(searchValue);
    });

    if (isFaang) {
      filteredListings = filteredListings.filter((listing) =>
        topTechCompanies.includes(listing.company)
      );
    }

    if (jobType !== 'both') {
      filteredListings = filteredListings.filter((listing) =>
        jobType === 'internships' ? listing.jobType === 'internship' : listing.jobType === 'newgrad'
      );
    }

    setFiltered(filteredListings);
    setPage(1);
    setHasMore(true);
  }, [search, filter, listings, isFaang, jobType]);

  useEffect(() => {
    const startIndex = 0;
    const endIndex = page * itemsPerPage;
    const newDisplayedListings = filtered.slice(startIndex, endIndex);
    setDisplayedListings(newDisplayedListings);
    setHasMore(endIndex < filtered.length);
  }, [filtered, page, itemsPerPage]);

  const lastListingElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setPage(1);
    setHasMore(true);
  };
  return (
    <div className="min-h-screen bg-gray-950/50 text-gray-100 px-4">

      <div className="max-w-4xl items-center mx-auto">
        <div className="relative flex w-full pt-4 justify-between gap-2 items-center group cursor-pointer">
          <div
            className={`${delaGothicOne.className} text-4xl`}>
            SCOUT
          </div>
          <div>
            <Button className="inline-flex items-center gap-2 rounded-md bg-gray-900 py-1.5 px-3 text-sm/6 font-semibold text-white shadow-inner focus:outline-none data-[hover]:bg-gray-800 data-[open]:bg-gray-700 data-[focus]:outline-1 data-[focus]:outline-white">
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto">
        <div className="mx-auto">
          <div className="flex flex-col w-full py-4 gap-4">
            {/* Search input - always visible */}
            <div className="w-full">
              <Field>
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search by ${filter}`}
                  className={clsx(
                    'block w-full rounded-md border-none bg-gray-900 py-1.5 px-3 text-sm/6 text-white',
                    'focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25'
                  )}
                />
              </Field>
            </div>

            {/* Desktop filters */}
            <div className="hidden md:flex md:flex-row w-full gap-2">
              <div className="w-1/3 flex gap-2">
                <Field className="w-1/2">
                  <div className="relative">
                    <Select
                      value={filter}
                      onChange={handleFilterChange}
                      className={clsx(
                        'block w-full appearance-none cursor-pointer rounded-md border-none bg-gray-900 py-1.5 px-3 text-sm/6 text-white',
                        'focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25',
                        '*:text-black'
                      )}
                    >
                      <option value="title">Job Title</option>
                      <option value="company">Company</option>
                      <option value="location">Location</option>
                    </Select>
                    <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60" />
                  </div>
                </Field>

                <Field className="w-1/2">
                  <div className="relative">
                    <Select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className={clsx(
                        'block w-full appearance-none cursor-pointer rounded-md border-none bg-gray-900 py-1.5 px-3 text-sm/6 text-white',
                        'focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25',
                        '*:text-black'
                      )}
                    >
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </Select>
                    <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60" />
                  </div>
                </Field>
              </div>

              <div className="w-2/3 flex gap-2">
                <div className={clsx(
                  'flex justify-between items-center w-1/2 appearance-none rounded-md border-none bg-gray-900 py-1.5 px-3 text-sm/6 text-white',
                )}>
                  <span>FAANG+</span>
                  <Switch
                    onClick={() => setIsFaang(!isFaang)}
                    className={`w-10 h-5 flex items-center rounded-full p-1 duration-200 ${isFaang ? "bg-blue-500" : "bg-gray-600"}`}
                  >
                    <div className={`h-4 w-4 rounded-full bg-white transform duration-200 ${isFaang ? "translate-x-5" : "translate-x-0"}`} />
                  </Switch>
                </div>

                <Field className="w-1/2">
                  <div className="relative">
                    <Select
                      value={jobType}
                      onChange={handleJobTypeChange}
                      className={clsx(
                        'block w-full appearance-none cursor-pointer rounded-md border-none bg-gray-900 py-1.5 px-3 text-sm/6 text-white',
                        'focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25',
                        '*:text-black'
                      )}
                    >
                      <option value="internships">Just Internships</option>
                      <option value="new-grads">Just New Grad</option>
                      <option value="both">Both</option>
                    </Select>
                    <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60" />
                  </div>
                </Field>
              </div>
            </div>

            {/* Mobile filters accordion */}
            <div className="md:hidden">
              <Disclosure>
                <DisclosureButton className="flex group w-full justify-between rounded-md bg-gray-900 px-4 py-2 text-left text-sm font-medium text-white">
                  <span>Filters</span>
                  <ChevronDown className="size-5 fill-white/60 group-data-[hover]:fill-white/50 group-data-[open]:rotate-180" />
                </DisclosureButton>
                <DisclosurePanel className="pt-4 -mt-1 bg-gray-900 p-2 rounded-b-lg space-y-4">
                  <Field>
                    <div className="relative">
                      <Select
                        value={filter}
                        onChange={handleFilterChange}
                        className="block w-full appearance-none cursor-pointer rounded-md border-none bg-gray-950/20 py-1.5 px-3 text-sm/6 text-white"
                      >
                        <option value="title">Job Title</option>
                        <option value="company">Company</option>
                        <option value="location">Location</option>
                      </Select>
                      <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60" />
                    </div>
                  </Field>

                  <Field>
                    <div className="relative">
                      <Select
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                        className="block w-full appearance-none cursor-pointer rounded-md border-none bg-gray-950/20 py-1.5 px-3 text-sm/6 text-white"
                      >
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                      </Select>
                      <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60" />
                    </div>
                  </Field>

                  <div className="flex justify-between items-center w-full appearance-none cursor-pointer rounded-md border-none bg-gray-950/20 py-1.5 px-3 text-sm/6 text-white">
                    <span>FAANG+</span>
                    <Switch
                      onClick={() => setIsFaang(!isFaang)}
                      className={`w-10 h-5 flex items-center rounded-full p-1 duration-200 ${isFaang ? "bg-blue-500" : "bg-gray-600"}`}
                    >
                      <div className={`h-4 w-4 rounded-full bg-white transform duration-200 ${isFaang ? "translate-x-5" : "translate-x-0"}`} />
                    </Switch>
                  </div>

                  <Field>
                    <div className="relative">
                      <Select
                        value={jobType}
                        onChange={handleJobTypeChange}
                        className="block w-full appearance-none cursor-pointer rounded-md border-none bg-gray-950/20 py-1.5 px-3 text-sm/6 text-white"
                      >
                        <option value="internships">Just Internships</option>
                        <option value="new-grads">Just New Grad</option>
                        <option value="both">Both</option>
                      </Select>
                      <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-4 fill-white/60" />
                    </div>
                  </Field>
                </DisclosurePanel>
              </Disclosure>
            </div>
          </div>


          {isLoading ? (
            <div className="container mx-auto flex-col flex items-center justify-center">
              <div className='text-xs py-4 text-gray-400'>Loading...</div>
              <div className="animate-pulse space-y-4 w-full max-w-4xl">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs text-gray-400 mb-4">
                Showing {displayedListings.length} of {filtered.length} listings
              </div>

              <div className="space-y-3">
                {displayedListings.length > 0 ? (
                  displayedListings.map((listing, index) => (
                    <ListingCard
                      key={index}
                      ref={index === displayedListings.length - 1 ? lastListingElementRef : null}
                      listing={listing}
                    />
                  ))
                ) : (
                  <p className="text-center text-gray-400">No listings found.</p>
                )}
              </div>

              {hasMore && (
                <div className="text-center py-4">
                  <div className="animate-pulse text-gray-400">Loading more...</div>
                </div>
              )}
            </div>
          )}
        </div>
        <AlertForm
          isOpen={showAlertForm}
          onClose={() => setShowAlertForm(false)}
        />
      </div>
    </div >
  );
}