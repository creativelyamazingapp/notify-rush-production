import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSubmit, useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  TextField,
  Button,
  Text,
  DataTable,
  Banner,
  Frame,
  Toast,
  Select,
  Modal,
  Checkbox,
  Icon,
} from "@shopify/polaris";
import { format, subDays, subMonths, differenceInDays } from "date-fns";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import "../componenets/style.css";
import { authenticate } from "app/shopify.server";
import EmailModal from "app/componenets/EmailModal";
import EmailConfirmationModal from "app/componenets/EmailConfirmationModal";
import { sendEmail } from "./sendEmail";
import { MdToggleOn, MdToggleOff } from "react-icons/md";
import { FiRefreshCcw } from "react-icons/fi";

// React-ChartJS-2 imports
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import EmailPreviewModal from "app/componenets/EmailPreviewModal";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const prisma = new PrismaClient();

type LoaderData = {
  totalSalesAmount: number;
  currencyCode: string;
  totalRefundAmount: number;
  totalProfit: number;
  totalRefundedAmount: number;
  ordersTableData: {
    orderNumber: string;
    orderGID: string;
    customerName: string;
    customerEmail: string;
    orderDate: string;
    orderedProducts: string;
    isRefunded: string;
    orderAmount: string;
    refundNote: string;
    shippingStatus?: string;
    shippingLastUpdated?: string;
    shippingCarrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  }[];
  currentPage: number;
  totalPages: number;
  allOrders: {
    orderNumber: string;
    orderGID: string;
    customerName: string;
    customerEmail: string;
    orderDate: string;
    orderedProducts: string;
    isRefunded: string;
    orderAmount: string;
    refundNote: string;
    shippingStatus?: string;
    shippingLastUpdated?: string;
    shippingCarrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  }[];
  totalOrdersCount: number;
  totalShippedOrdersCount: number;
  totalRefundedOrdersCount: number;
  totalUnfulfilledOrdersCount: number;
  shop: string;
};

// ---------- LOADER -------------
export const loader: LoaderFunction = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const url = new URL(request.url);
  const startDateParam = url.searchParams.get("startDate");
  const endDateParam = url.searchParams.get("endDate");
  const pageParam = url.searchParams.get("page") || "1";
  const filterType = url.searchParams.get("filterType") || "All";
  const pageSizeParam = url.searchParams.get("pageSize") || "20";
  const pageSize = parseInt(pageSizeParam, 10);

  const page = parseInt(pageParam, 10);
  const startDate = startDateParam ? new Date(startDateParam) : undefined;
  const endDate = endDateParam ? new Date(endDateParam) : undefined;

  let refundedFilter: any = {};
  if (filterType === "Refunded") {
    refundedFilter = { refunds: { some: {} } };
  } else if (filterType === "Non-Refunded") {
    refundedFilter = { refunds: { none: {} } };
  } else if (filterType === "Shipped") {
    refundedFilter = {
      fulfillmentStatus: {
        in: [
          "Confirmed",
          "In Transit",
          "Out Of Delivery",
          "Out for Delivery",
          "Delivered",
          "Shipped-Unknown Status",
          "sucess",
        ],
      },
    };
  } else if (filterType === "Non-Shipped") {
    refundedFilter = {
      OR: [
        {
          fulfillmentStatus: {
            notIn: [
              "Confirmed",
              "In Transit",
              "Out Of Delivery",
              "Out for Delivery",
              "Delivered",
              "Shipped-Unknown Status",
              "sucess",
            ],
          },
        },
        { fulfillmentStatus: null },
      ],
    };
  }

  const skip = (page - 1) * pageSize;

  const salesAggregate = await prisma.order.aggregate({
    _sum: { totalPrice: true },
    where: { shop, createdAt: { gte: startDate, lte: endDate } },
  });

  const refundsAggregate = await prisma.refund.aggregate({
    _sum: { amount: true },
    where: { order: { shop, createdAt: { gte: startDate, lte: endDate } } },
  });

  const allOrdersRaw = await prisma.order.findMany({
    where: {
      shop,
      createdAt: { gte: startDate, lte: endDate },
      ...refundedFilter,
    },
    include: { lineItems: true, refunds: true },
    orderBy: { createdAt: "asc" },
  });

  const pagedOrders = await prisma.order.findMany({
    where: {
      shop,
      createdAt: { gte: startDate, lte: endDate },
      ...refundedFilter,
    },
    include: { lineItems: true, refunds: true },
    orderBy: { createdAt: "asc" },
    skip,
    take: pageSize,
  });

  // Map each order and extract the numeric portion of the order GID
  const mapOrder = (order: any) => {
    const products = order.lineItems.map((item: any) => item.title).join(", ");
    const isRefunded = order.refunds.length > 0 ? "Yes" : "No";
    const refundNote =
      order.refunds.length > 0 ? order.refunds[0].note || "No Note" : "N/A";
    const shippingStatus = order.fulfillmentStatus || "N/A";
    console.log("Shipping Status", shippingStatus);
    const shippingLastUpdated = order.fulfillmentLastUpdatedDate
      ? format(order.fulfillmentLastUpdatedDate, "yyyy-MM-dd")
      : "N/A";
    const shippingCarrier = order.trackingCompany || "N/A";
    const trackingNumber = order.fulfillmentTrackingNumber || "N/A";
    const trackingUrl = order.fulfillmentTrackingUrl || "N/A";
    return {
      orderNumber: order.name,
      orderGID: order.id.split("/").pop() || order.id, // CHANGED: Extract numeric portion for correct order link
      customerName: `${order.customerFirstName || "N/A"} ${order.customerLastName || "N/A"}`,
      customerEmail: order.email || "",
      orderDate: format(order.createdAt, "yyyy-MM-dd"),
      orderedProducts: products,
      isRefunded,
      orderAmount: order.totalPrice.toFixed(2),
      refundNote,
      shippingStatus,
      shippingLastUpdated,
      shippingCarrier,
      trackingNumber,
      trackingUrl,
    };
  };

  const ordersTableData = pagedOrders.map(mapOrder);
  const allOrdersTableData = allOrdersRaw.map(mapOrder);

  const totalSalesAmount = salesAggregate._sum.totalPrice || 0;
  const totalRefundAmount = refundsAggregate._sum.amount || 0;
  const totalProfit = totalSalesAmount - totalRefundAmount;
  const totalOrdersCount = allOrdersRaw.length;
  const shippedStatuses = [
    "Confirmed",
    "In Transit",
    "Out Of Delivery",
    "Out for Delivery",
    "Delivered",
  ];
  const totalShippedOrdersCount = allOrdersRaw.filter((o: any) =>
    shippedStatuses.includes(o.fulfillmentStatus ?? "")
  ).length;
  const totalRefundedOrdersCount = allOrdersRaw.filter(
    (o: any) => o.refunds.length > 0
  ).length;
  const totalUnfulfilledOrdersCount = allOrdersRaw.filter(
    (o: any) => !shippedStatuses.includes(o.fulfillmentStatus ?? "")
  ).length;
  const totalPages = Math.ceil(allOrdersRaw.length / pageSize);

  return json<LoaderData>({
    totalSalesAmount,
    currencyCode: pagedOrders[0]?.currencyCode || "USD",
    totalRefundAmount,
    totalProfit,
    totalRefundedAmount: totalRefundAmount,
    ordersTableData,
    currentPage: page,
    totalPages,
    allOrders: allOrdersTableData,
    totalOrdersCount,
    totalShippedOrdersCount,
    totalRefundedOrdersCount,
    totalUnfulfilledOrdersCount,
    shop,
  });
};

//
// Custom Checkbox Dropdown Component with Search and Auto-Close
//
type CheckboxDropdownProps = {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  helpText?: string;
};

function CheckboxDropdown({
  label,
  options,
  selected,
  onChange,
  helpText,
}: CheckboxDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => setOpen((prev) => !prev);

  const filteredOptions = useMemo(() => {
    if (!searchText) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        open &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (open && event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", overflow: "visible" }}
    >
      <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block" }}>
        {label}
      </label>
      <button
        type="button"
        onClick={toggleOpen}
        style={{
          width: "100%",
          padding: "8px",
          textAlign: "left",
          border: "1px solid #ccc",
          borderRadius: "4px",
          backgroundColor: "#fff",
        }}
      >
        {selected.length > 0 ? selected.join(", ") : "Select options"}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "#fff",
            zIndex: 1000,
            maxHeight: "200px",
            overflowY: "auto",
            marginTop: "2px",
          }}
        >
          <div style={{ padding: "4px 8px" }}>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search products..."
              style={{
                width: "100%",
                padding: "4px",
                boxSizing: "border-box",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div key={opt.value} style={{ padding: "4px 8px" }}>
                <label style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={selected.includes(opt.value)}
                    onChange={() => {
                      if (selected.includes(opt.value)) {
                        onChange(selected.filter((x) => x !== opt.value));
                      } else {
                        onChange([...selected, opt.value]);
                      }
                    }}
                    style={{ marginRight: "8px" }}
                  />
                  {opt.label}
                </label>
              </div>
            ))
          ) : (
            <div style={{ padding: "4px 8px" }}>No options found</div>
          )}
        </div>
      )}
      {helpText && (
        <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "4px" }}>
          {helpText}
        </div>
      )}
    </div>
  );
}

//
// Custom Round Toggle Switch Component
//
type RoundToggleProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
};

function RoundToggle({ checked, onChange, label }: RoundToggleProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {label && <span style={{ fontWeight: "bold" }}>{label}</span>}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: "40px",
          height: "20px",
          borderRadius: "10px",
          border: "none",
          backgroundColor: checked ? "#22c55e" : "#ccc",
          position: "relative",
          cursor: "pointer",
          outline: "none",
          transition: "background-color 0.2s ease",
        }}
      >
        <div
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            backgroundColor: "#fff",
            position: "absolute",
            top: "1px",
            left: checked ? "20px" : "1px",
            transition: "left 0.2s ease",
          }}
        />
      </button>
    </div>
  );
}

//
// Dashboard Component
//
export default function Dashboard() {
  const {
    currencyCode,
    totalRefundedAmount,
    ordersTableData,
    currentPage,
    totalPages,
    totalSalesAmount,
    totalProfit,
    totalRefundAmount,
    allOrders,
    totalOrdersCount,
    totalShippedOrdersCount,
    totalRefundedOrdersCount,
    totalUnfulfilledOrdersCount,
    shop,
  } = useLoaderData<LoaderData>();

  const fetcher = useFetcher();
  const submit = useSubmit();
  const preventDuplicates = false;

  // Basic states
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 2), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("All");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [noUserEmail, setNoUserEmail] = useState("");
  const [activeToast, setActiveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toggleToast = useCallback(() => setActiveToast((v) => !v), []);

  // Email modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any[]>([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Chart data
  const [chartRefundAmount, setChartRefundAmount] = useState(0);
  const [chartProfit, setChartProfit] = useState(0);
  const [chartMainData, setChartMainData] = useState<any[]>([]);
  const [topRefundedProducts, setTopRefundedProducts] = useState<any[]>([]);
  const [topReasons, setTopReasons] = useState<any[]>([]);
  const [topRefundedAmount, setTopRefundedAmount] = useState(0);

  // Page size
  const [pageSize, setPageSize] = useState("20");

  // Sorting "Is Refunded"
  const [sortColumnIndex, setSortColumnIndex] = useState<number | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<"ascending" | "descending" | undefined>(undefined);

  // Advanced product filtering using custom checkbox dropdowns.
  const [includeProducts, setIncludeProducts] = useState<string[]>([]);
  const [excludeProducts, setExcludeProducts] = useState<string[]>([]);

  // Toggle for advanced product filters.
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Advanced Shipped Filter states (only when "Shipped" filter is active)
  const [advancedShippedStatus, setAdvancedShippedStatus] = useState("");
  const [inTransitDaysOperator, setInTransitDaysOperator] = useState("=");
  const [inTransitDays, setInTransitDays] = useState("");

  const handleToggle = () => {
    setShowAdvancedFilters((prev) => !prev);
  };

  // Clear Filter button handler.
  const handleClearFilters = () => {
    setIncludeProducts([]);
    setExcludeProducts([]);
  };

  // Compute dynamic product options from allOrders data.
  const dynamicProductOptions = useMemo(() => {
    const prodSet = new Set<string>();
    allOrders.forEach((order) => {
      order.orderedProducts.split(",").forEach((prod) => {
        const trimmed = prod.trim();
        if (trimmed) prodSet.add(trimmed);
      });
    });
    return Array.from(prodSet).map((product) => ({
      value: product,
      label: product,
    }));
  }, [allOrders]);

  // On mount, read pageSize from URL if present.
  useEffect(() => {
    const url = new URL(window.location.href);
    const ps = url.searchParams.get("pageSize") || "20";
    setPageSize(ps);
  }, []);

  // Chart fetch logic.
  const fetchChartData = () => {
    setLoading(true);
    const fullUrl = `/chartData?startDate=${startDate}&endDate=${endDate}`;
    fetcher.load(fullUrl);
  };

  useEffect(() => {
    fetcher.load(`/chartData?startDate=${startDate}&endDate=${endDate}`);
  }, [startDate, endDate]);

  useEffect(() => {
    if (fetcher.data) {
      const {
        totalRefundAmount: newRefundAmt,
        totalProfit: newProfit,
        chartData,
        topReasons: reasons,
        topRefundedProducts: refundedProds,
        totalRefundAmountFromTopReasons,
      } = fetcher.data;
      setChartRefundAmount(newRefundAmt);
      setChartProfit(newProfit);
      setChartMainData(chartData);
      setTopReasons(reasons);
      setTopRefundedProducts(refundedProds);
      setTopRefundedAmount(totalRefundAmountFromTopReasons);
      setLoading(false);
    }
  }, [fetcher.data]);

  useEffect(() => {
    setLoading(false);
  }, [allOrders]);

  // Date filter submission.
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.set("startDate", startDate);
    formData.set("endDate", endDate);
    submit(formData, { method: "get" });
  };

  const setDateRange = (days: number) => {
    setLoading(true);
    const end = new Date();
    const start = subDays(end, days);
    setStartDate(format(start, "yyyy-MM-dd"));
    setEndDate(format(end, "yyyy-MM-dd"));
    const formData = new FormData();
    formData.set("startDate", format(start, "yyyy-MM-dd"));
    formData.set("endDate", format(end, "yyyy-MM-dd"));
    submit(formData, { method: "get" });
  };

  // Step 1: Build base filtered orders from filterType and searchQuery.
  let baseFilteredOrders = (searchQuery ? allOrders : ordersTableData)
    .filter((order) => {
      if (filterType === "Refunded") return order.isRefunded === "Yes";
      if (filterType === "Non-Refunded") return order.isRefunded === "No";
      if (filterType === "Shipped") {
        return (
          order.shippingStatus === "Confirmed" ||
          order.shippingStatus === "In Transit" ||
          order.shippingStatus === "Out Of Delivery" ||
          order.shippingStatus === "Out for Delivery" ||
          order.shippingStatus === "Delivered" ||
          order.shippingStatus === "Shipped-Unknown Status" ||
          order.shippingStatus === "sucess"
        );
      }
      if (filterType === "Non-Shipped") {
        return !(
          order.shippingStatus === "Confirmed" ||
          order.shippingStatus === "In Transit" ||
          order.shippingStatus === "Out Of Delivery" ||
          order.shippingStatus === "Out for Delivery" ||
          order.shippingStatus === "Delivered" ||
          order.shippingStatus === "Shipped-Unknown Status" ||
          order.shippingStatus === "sucess"
        );
      }
      return true;
    })
    .filter((order) => {
      if (!searchQuery) return true;
      const queries = searchQuery
        .split(",")
        .map((q) => q.trim().toLowerCase())
        .filter(Boolean);
      if (!queries.length) return true;
      return queries.some((q) => order.orderNumber.toLowerCase().includes(q));
    });

  // Step 1.5: If filter is "Shipped" and advanced shipped filter is applied, further filter by advancedShippedStatus.
  if (filterType === "Shipped" && advancedShippedStatus) {
    baseFilteredOrders = baseFilteredOrders.filter(
      (order) => order.shippingStatus === advancedShippedStatus
    );
    if (advancedShippedStatus === "In Transit" && inTransitDays) {
      baseFilteredOrders = baseFilteredOrders.filter((order) => {
        if (order.shippingLastUpdated === "N/A") return false;
        const diffDays = differenceInDays(new Date(), new Date(order.shippingLastUpdated));
        const numDays = parseInt(inTransitDays, 10);
        if (inTransitDaysOperator === "=") return diffDays === numDays;
        if (inTransitDaysOperator === ">") return diffDays > numDays;
        if (inTransitDaysOperator === "<") return diffDays < numDays;
        return true;
      });
    }
  }

  // Step 3: Sorting for "Is Refunded" if allowed.
  const canSortRefunded =
    filterType === "All" ||
    filterType === "Shipped" ||
    filterType === "Non-Shipped";
  let finalOrders = [...baseFilteredOrders];
  if (canSortRefunded && sortColumnIndex === 8 && sortDirection) {
    finalOrders.sort((a, b) => {
      const aVal = a.isRefunded === "Yes" ? 1 : 0;
      const bVal = b.isRefunded === "Yes" ? 1 : 0;
      return sortDirection === "ascending" ? aVal - bVal : bVal - aVal;
    });
  }

  // Expand/collapse.
  const toggleRowExpansion = (orderNumber: string) => {
    setExpandedRows((prev) => ({ ...prev, [orderNumber]: !prev[orderNumber] }));
  };

  // Checkbox handlers.
  const handleCheckboxChange = (orderNumber: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderNumber)
        ? prev.filter((id) => id !== orderNumber)
        : [...prev, orderNumber]
    );
  };

  const handleSelectAllChange = (evt: any) => {
    if (evt.target.checked) {
      const allNums = finalOrders.map((ord) => ord.orderNumber);
      setSelectedOrders(allNums);
    } else {
      setSelectedOrders([]);
    }
  };

  // Prepare table rows.
  const getFormattedRows = () => {
    // Use the same expandable list logic for the product column for all filters.
    return finalOrders.map((order) => {
      const productTitles = order.orderedProducts.split(", ").filter(Boolean);
      const multi = productTitles.length > 1;
      const productCell = multi ? (
        <div
          style={{
            cursor: "pointer",
            color: "blue",
            textDecoration: "underline",
          }}
          onClick={() => toggleRowExpansion(order.orderNumber)}
        >
          {productTitles[0]} (+{productTitles.length - 1} more)
        </div>
      ) : (
        productTitles[0] || "N/A"
      );
      // For the "Shipped" filter branch as well, render the same expandable product cell.
      const baseRow = [
        <input
          type="checkbox"
          checked={selectedOrders.includes(order.orderNumber)}
          onChange={() => handleCheckboxChange(order.orderNumber)}
        />,
        <a
          href={`https://${shop}/admin/orders/${order.orderGID}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {order.orderNumber}
        </a>,
        order.orderDate,
        order.shippingStatus || "N/A",
        order.shippingLastUpdated || "N/A",
        order.customerName,
        order.customerEmail,
        productCell,
        order.isRefunded,
        order.orderAmount,
      ];
      if (expandedRows[order.orderNumber] && multi) {
        const extraRows = productTitles.slice(1).map((t) => [
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          <div style={{ paddingLeft: 20 }}>{t}</div>,
          "",
          "",
        ]);
        return [baseRow, ...extraRows];
      }
      return [baseRow];
    }).flat();
  };

  // Table column headings.
  const isRefundedHeading = (
    <Text as="span" variant="bodyMd" fontWeight="semibold">
      Is Refunded
    </Text>
  );
  const columnHeaders = [
    <input
      type="checkbox"
      checked={selectedOrders.length > 0 && selectedOrders.length === finalOrders.length}
      onChange={handleSelectAllChange}
    />,
    "Order #",
    "Order Date",
    "Shipping Status",
    "Shipping Last Updated",
    "Customer Name",
    "Email",
    "Ordered Products",
    isRefundedHeading,
    "Order Amount",
  ];

  // Display current filter label above table.
  const displayFilterLabel = () => {
    if (filterType === "All") return "Displaying: All Orders";
    if (filterType === "Refunded") return "Displaying: Refunded Orders";
    if (filterType === "Non-Refunded") return "Displaying: Non-Refunded Orders";
    if (filterType === "Shipped") {
      return advancedShippedStatus
        ? `Displaying: Shipped Orders - ${advancedShippedStatus} (${finalOrders.filter(order => order.shippingStatus === advancedShippedStatus).length} orders)`
        : "Displaying: Shipped Orders";
    }
    if (filterType === "Non-Shipped") return "Displaying: Non-Shipped Orders";
    return "";
  };

  // Filter button handler.
  const changeFilter = (fType: string) => {
    setLoading(true);
    setFilterType(fType);
    if (fType === "Refunded" || fType === "Non-Refunded") {
      setSortColumnIndex(undefined);
      setSortDirection(undefined);
    }
    if (fType !== "Shipped") {
      setAdvancedShippedStatus("");
      setInTransitDays("");
    }
    const url = new URL(window.location.href);
    url.searchParams.set("filterType", fType);
    url.searchParams.set("page", "1");
    submit(url.searchParams, { method: "get" });
  };

  // Pagination handlers.
  const goToPage = (p: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", p.toString());
    submit(url.searchParams, { method: "get" });
  };

  const changePageSize = (value: string) => {
    setLoading(true);
    setPageSize(value);
    const url = new URL(window.location.href);
    url.searchParams.set("pageSize", value);
    url.searchParams.set("page", "1");
    submit(url.searchParams, { method: "get" });
  };

  // Prepare orders for preview modal.
  const previewOrders: OrderPreview[] = useMemo(() => {
    return selectedOrders
      .map((num) => allOrders.find((o) => o.orderNumber === num))
      .filter(Boolean) as OrderPreview[];
  }, [selectedOrders, allOrders]);

  // When the user clicks "Send Email", show the preview modal.
  const handleSendEmail = () => {
    const enriched = selectedOrders
      .map((num) => allOrders.find((o) => o.orderNumber === num))
      .filter(Boolean);
    if (!enriched.length) {
      setNoUserEmail("No valid emails found in the selected orders.");
      return;
    }
    setPreviewModalOpen(true);
  };

  // When the user confirms in the preview modal, close it and open the EmailModal.
  const handleConfirmFinalSend = () => {
    setPreviewModalOpen(false);
    let ordersToSend = previewOrders;
    if (preventDuplicates) {
      const seen = new Set();
      ordersToSend = ordersToSend.filter((order) => {
        if (seen.has(order.customerEmail)) return false;
        seen.add(order.customerEmail);
        return true;
      });
    }
    setSelectedOrders(ordersToSend.map((o) => o.orderNumber));
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const sendEmailsToCustomers = async (templateData: any) => {
    const { subject, bodyHtml, bodyText } = templateData;
    let ordersToSend = previewOrders;
    if (preventDuplicates) {
      const seen = new Set();
      ordersToSend = ordersToSend.filter((order) => {
        if (seen.has(order.customerEmail)) return false;
        seen.add(order.customerEmail);
        return true;
      });
    }
    const results: any[] = [];
    for (let i = 0; i < ordersToSend.length; i++) {
      const order = ordersToSend[i];
      const toAddress = order.customerEmail;
      const orderId = order.orderNumber;
      const customerName = order.customerName;
      try {
        const response = await fetch("/sendEmail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toAddresses: [toAddress],
            subject,
            bodyHtml,
            bodyText,
            orderId,
            customerName,
          }),
        });
        if (!response.ok) {
          const errData = await response.json();
          setToastMessage(errData.error || "Error sending email.");
          setActiveToast(true);
          results.push({
            sNo: i + 1,
            dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
            customerName,
            customerEmail: toAddress,
            orderNumber: orderId,
            status: "Error",
          });
        } else {
          results.push({
            sNo: i + 1,
            dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
            customerName,
            customerEmail: toAddress,
            orderNumber: orderId,
            status: "Delivered",
          });
        }
      } catch (error) {
        console.error("Error sending email:", error);
        setToastMessage("An unexpected error occurred while sending the email.");
        setActiveToast(true);
        results.push({
          sNo: i + 1,
          dateTime: format(new Date(), "MMM d, yyyy h:mm aa"),
          customerName,
          customerEmail: toAddress,
          orderNumber: orderId,
          status: "Error",
        });
      }
    }
    setIsModalOpen(false);
    setConfirmationData(results);
    setIsConfirmationModalOpen(true);
  };

  const doughnutData = {
    labels: ["Shipped", "Refunded", "Unfulfilled"],
    datasets: [
      {
        label: "Order Distribution",
        data: [totalShippedOrdersCount, totalRefundedOrdersCount, totalUnfulfilledOrdersCount],
        backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"],
        hoverOffset: 4,
      },
    ],
  };
  const barData = {
    labels: ["Total Sales", "Refunded"],
    datasets: [
      {
        label: "Amount",
        backgroundColor: ["#4CAF50", "#F44336"],
        data: [totalSalesAmount, totalRefundAmount],
      },
    ],
  };
  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Sales vs. Refund" },
    },
  };

  return (
    <Page fullWidth title="Notify Rush - Dashboard">
    <Frame>
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner" />
            <h1 className="loading-text">Loading...</h1>
          </div>
        )}
        {errorMessage && (
          <Card sectioned>
            <Text variant="critical" color="red">
              {errorMessage}
            </Text>
          </Card>
        )}
        {noUserEmail && (
          <Banner status="critical" title="Error">
            <p>{noUserEmail}</p>
          </Banner>
        )}
        <Layout>
          <div className="responsive-layout">
            <div className="flex flex-row">
              {/* Left side: date filters & charts */}
              <Layout.Section>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "32px",
                    padding: "16px",
                    backgroundColor: "#f7f9fc",
                    borderRadius: "12px",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  {/* Date Filter Card */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "16px",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px",
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    <TextField
                      label="Start Date"
                      type="date"
                      value={startDate}
                      onChange={(val) => setStartDate(val)}
                      autoComplete="off"
                      style={{ flex: "1 1 auto", minWidth: "150px" }}
                    />
                    <TextField
                      label="End Date"
                      type="date"
                      value={endDate}
                      onChange={(val) => setEndDate(val)}
                      autoComplete="off"
                      style={{ flex: "1 1 auto", minWidth: "150px" }}
                    />
                    <Button
                      primary
                      onClick={handleSubmit}
                      disabled={loading}
                      style={{
                        padding: "12px 20px",
                        fontWeight: "bold",
                        fontSize: "16px",
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: "16px",
                    }}
                  >
                    <Button onClick={() => setDateRange(7)}>Last 7 Days</Button>
                    <Button onClick={() => setDateRange(30)}>Last 30 Days</Button>
                    <Button onClick={() => setDateRange(60)}>Last 60 Days</Button>
                  </div>
                  {/* Summary + Charts */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: "32px",
                    }}
                  >
                    <Card
                      sectioned
                      style={{ padding: "16px", borderRadius: "12px" }}
                    >
                      <div style={{ marginBottom: "20px" }}>
                        <Text variant="headingLg">Summary</Text>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: "16px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "24px", color: "#2b6cb0" }}>💰</span>
                          <Text variant="bodyMd">
                            Total Sales: {totalSalesAmount.toFixed(2)} {currencyCode}
                          </Text>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "24px", color: "#48bb78" }}>📦</span>
                          <Text variant="bodyMd">
                            Total Orders: {totalOrdersCount}
                          </Text>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "24px", color: "#38a169" }}>🚚</span>
                          <Text variant="bodyMd">
                            Shipped: {totalShippedOrdersCount}
                          </Text>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "24px", color: "#e53e3e" }}>🔄</span>
                          <Text variant="bodyMd">
                            Refunded: {totalRefundedOrdersCount}
                          </Text>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "24px", color: "#dd6b20" }}>❗</span>
                          <Text variant="bodyMd">
                            Unfulfilled: {totalUnfulfilledOrdersCount}
                          </Text>
                        </div>
                      </div>
                    </Card>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "16px",
                      }}
                    >
                      <Card
                        sectioned
                        style={{ borderRadius: "12px", padding: "16px" }}
                      >
                        <Text variant="headingMd" style={{ marginBottom: "8px" }}>
                          Order Distribution
                        </Text>
                        <div style={{ height: "300px", width: "100%" }}>
                          <Doughnut data={doughnutData} />
                        </div>
                      </Card>
                      <Card
                        sectioned
                        style={{ borderRadius: "12px", padding: "16px" }}
                      >
                        <Text variant="headingMd" style={{ marginBottom: "8px" }}>
                          Sales vs. Refund
                        </Text>
                        <div style={{ height: "300px", width: "100%" }}>
                          <Bar data={barData} options={barOptions} />
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              </Layout.Section>
              {/* Right Panel: Orders Table */}
              <Layout.Section>
                {selectedOrders.length > 0 && (
                  <div
                    onClick={handleSendEmail}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "#28a745",
                      color: "white",
                      borderRadius: "15px",
                      margin: "20px 50px",
                    }}
                  >
                    <p style={{ textAlign: "center", fontSize: "30px", padding: "10px" }}>
                      Send Email
                    </p>
                  </div>
                )}
                <EmailModal
                  isOpen={isModalOpen}
                  onClose={handleModalClose}
                  onSend={(template) => sendEmailsToCustomers(template)}
                />
                <EmailConfirmationModal
                  isOpen={isConfirmationModalOpen}
                  onClose={() => setIsConfirmationModalOpen(false)}
                  data={confirmationData}
                />
                <EmailPreviewModal
                  isOpen={previewModalOpen}
                  orders={previewOrders}
                  onClose={() => setPreviewModalOpen(false)}
                  onConfirm={handleConfirmFinalSend}
                />
               
                  {/* Filter Buttons */}
                  <Card sectioned>
                    <div style={{ display: "flex", justifyContent: "center", gap: "30px" }}>
                      <Button onClick={() => changeFilter("All")} primary={filterType === "All"} disabled={loading}>
                        All Orders
                      </Button>
                      <Button onClick={() => changeFilter("Refunded")} primary={filterType === "Refunded"} disabled={loading}>
                        Refunded
                      </Button>
                      <Button onClick={() => changeFilter("Non-Refunded")} primary={filterType === "Non-Refunded"} disabled={loading}>
                        Non-Refunded
                      </Button>
                      <Button onClick={() => changeFilter("Shipped")} primary={filterType === "Shipped"} disabled={loading}>
                        Shipped
                      </Button>
                      <Button onClick={() => changeFilter("Non-Shipped")} primary={filterType === "Non-Shipped"} disabled={loading}>
                        Non-Shipped
                      </Button>
                    </div>
                  </Card>


                  {/* Display current filter label above table */}
                <Card sectioned>
                  <Text variant="headingSm">{displayFilterLabel()}</Text>
                </Card>
                {/* Advanced Shipped Filter (only visible when "Shipped" filter is active) */}
                {filterType === "Shipped" && (
                  <Card sectioned>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <Select
                        label="Advanced Shipped Filter"
                        options={[
                          { label: "Confirmed", value: "Confirmed" },
                          { label: "In Transit", value: "In Transit" },
                          { label: "Out Of Delivery", value: "Out Of Delivery" },
                          { label: "Out for Delivery", value: "Out for Delivery" },
                          { label: "Delivered", value: "Delivered" },
                          { label: "Shipped-Unknown Status", value: "Shipped-Unknown Status" },
                          { label: "sucess", value: "sucess" },
                        ]}
                        value={advancedShippedStatus}
                        onChange={setAdvancedShippedStatus}
                      />
                      {advancedShippedStatus && (
                        <Text variant="bodySm">
                          {finalOrders.filter(order => order.shippingStatus === advancedShippedStatus).length} orders with status {advancedShippedStatus}
                        </Text>
                      )}
                      {advancedShippedStatus === "In Transit" && (
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <Select
                            label="Days Operator"
                            options={[
                              { label: "=", value: "=" },
                              { label: ">", value: ">" },
                              { label: "<", value: "<" },
                            ]}
                            value={inTransitDaysOperator}
                            onChange={setInTransitDaysOperator}
                          />
                          <TextField
                            label="Days"
                            type="number"
                            value={inTransitDays}
                            onChange={setInTransitDays}
                            autoComplete="off"
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                )}
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {/* Basic search bar */}
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      justifyContent: "center",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                        padding: "20px",
                      }}
                    >
                      <label
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "600",
                          marginBottom: "6px",
                          color: "#333",
                        }}
                      >
                        Search Orders
                      </label>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          let input = e.target.value;
                          if (input.indexOf(",") === -1 && input.indexOf("#") !== -1) {
                            if (input.charAt(0) === "#") {
                              input = "#" + input.substring(1).replace(/#/g, ",#");
                            } else {
                              input = input.replace(/#/g, ",#");
                              if (input.startsWith(",")) {
                                input = input.substring(1);
                              }
                            }
                            if (input.endsWith(",")) {
                              input = input.slice(0, -1);
                            }
                          }
                          setSearchQuery(input);
                        }}
                        placeholder="Search by order #, name, or product"
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #ccc",
                          borderRadius: "8px",
                          fontSize: "16px",
                          outline: "none",
                          transition: "border-color 0.2s ease-in-out",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                        onBlur={(e) => (e.target.style.borderColor = "#ccc")}
                      />
                      {/* Advanced Filter Toggle with Clear Filter Button */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          margin: "30px 10px 10px 10px",
                          gap: "20px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <label
                            style={{
                              display: "block",
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#333",
                            }}
                          >
                            Advanced Filter
                          </label>
                          <div
                            onClick={() => handleToggle()}
                            style={{
                              width: "70px",
                              height: "35px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "35px",
                              cursor: "pointer",
                              transition: "all 0.3s ease-in-out",
                            }}
                          >
                            <div style={{ fontSize: "50px", fontWeight: "bold", width: "30px" }}>
                              {showAdvancedFilters ? (
                                <div style={{ color: "green" }}>
                                  <MdToggleOn />
                                </div>
                              ) : (
                                <div style={{ color: "black" }}>
                                  <MdToggleOff />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "20px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                          }}
                          onClick={handleClearFilters}
                          title="Clear Products"
                        >
                          <FiRefreshCcw />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* ADVANCED PRODUCT FILTERS: Using custom checkbox dropdowns with search */}
                  {showAdvancedFilters && (
                    <div
                      style={{
                        width: "100%",
                        padding: "16px",
                        marginTop: "16px",
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "24px",
                          width: "100%",
                        }}
                      >
                        <div style={{ flex: "1 1 45%", minWidth: "300px" }}>
                          <CheckboxDropdown
                            label="Include Products"
                            options={dynamicProductOptions}
                            selected={includeProducts}
                            onChange={setIncludeProducts}
                            helpText="If an order contains at least one of these items, it is included."
                          />
                        </div>
                        <div style={{ flex: "1 1 45%", minWidth: "300px" }}>
                          <CheckboxDropdown
                            label="Exclude Products"
                            options={dynamicProductOptions}
                            selected={excludeProducts}
                            onChange={setExcludeProducts}
                            helpText="If an order contains any of these items, it is excluded."
                          />
                        </div>
                      </div>
                      {includeProducts.length > 0 && (
                        <p
                          style={{
                            marginTop: "12px",
                            fontSize: "14px",
                            color: "#4A4A4A",
                            fontWeight: "500",
                          }}
                        >
                          Include:{" "}
                          <span style={{ color: "#15803D", fontWeight: "600" }}>
                            {includeProducts.join(", ")}
                          </span>
                        </p>
                      )}
                      {excludeProducts.length > 0 && (
                        <p
                          style={{
                            marginTop: "4px",
                            fontSize: "14px",
                            color: "#4A4A4A",
                            fontWeight: "500",
                          }}
                        >
                          Exclude:{" "}
                          <span style={{ color: "#DC2626", fontWeight: "600" }}>
                            {excludeProducts.join(", ")}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                  {/* Orders Table */}
                  <Card title="Order Details">
                    <div className="custom-data-table">
                      <DataTable
                        sortable={[
                          true,
                          false,
                          false,
                          false,
                          false,
                          false,
                          false,
                          false,
                          filterType === "All" ||
                            filterType === "Shipped" ||
                            filterType === "Non-Shipped",
                          false,
                        ]}
                        onSort={(columnIndex, direction) => {
                          if (
                            (filterType === "All" ||
                              filterType === "Shipped" ||
                              filterType === "Non-Shipped") &&
                            columnIndex === 8
                          ) {
                            setSortColumnIndex(8);
                            setSortDirection(direction);
                          }
                        }}
                        sortColumnIndex={sortColumnIndex}
                        sortDirection={sortDirection}
                        columnContentTypes={[
                          "text",
                          "text",
                          "text",
                          "text",
                          "text",
                          "text",
                          "text",
                          "text",
                          "text",
                          "text",
                        ]}
                        headings={columnHeaders}
                        rows={getFormattedRows()}
                        footerContent={`Total Orders: ${finalOrders.length}`}
                      />
                    </div>
                    <div
                      style={{
                        width: "15%",
                        justifySelf: "end",
                        margin: "10px",
                      }}
                    >
                      <Card sectioned>
                        <Text variant="headingMd">Records per page:</Text>
                        <Select
                          options={[
                            { label: "20", value: "20" },
                            { label: "50", value: "50" },
                            { label: "70", value: "70" },
                            { label: "100", value: "100" },
                          ]}
                          value={pageSize}
                          onChange={(value) => changePageSize(value)}
                          disabled={loading}
                        />
                      </Card>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "20px",
                      }}
                    >
                      {currentPage > 1 && (
                        <Button onClick={() => goToPage(1)}>First</Button>
                      )}
                      {currentPage > 1 && (
                        <Button onClick={() => goToPage(currentPage - 1)}>
                          Previous
                        </Button>
                      )}
                      <Text variant="bodyMd">
                        Page {currentPage} of {totalPages}
                      </Text>
                      {currentPage < totalPages && (
                        <Button onClick={() => goToPage(currentPage + 1)}>
                          Next
                        </Button>
                      )}
                      {currentPage < totalPages && (
                        <Button onClick={() => goToPage(totalPages)}>
                          Last
                        </Button>
                      )}
                    </div>
                  </Card>
                </div>
              </Layout.Section>
            </div>
          </div>
        </Layout>
        {activeToast && (
          <Toast content={toastMessage} error onDismiss={toggleToast} />
        )}
      
    </Frame>
    </Page>
  );
}
