enum Status
{
    STATUS_START_SPARSE_KERNEL = 0,
    // will also return the number of constant q frames
    STATUS_SPARSE_KERNEL_COMPLETE = 1,
    // will also return the number of constant q samples in most recent iteration
    STATUS_CONSTANTQ_ITEM = 2,
    STATUS_CANCELLED = 3
};
