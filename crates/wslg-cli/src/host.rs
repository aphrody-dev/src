//! WinUI 3 host side of the compositor (L5): the DispatcherQueue that drives presentation.
//! Split from the D3D12 + DirectComposition HAL (crates/dx12-hal) by ticket dx12-001.

use tracing::info;
use windows::System::DispatcherQueueController;
use windows::Win32::System::WinRT::{
    CreateDispatcherQueueController, DQTAT_COM_NONE, DQTYPE_THREAD_CURRENT, DispatcherQueueOptions,
};

pub struct WinUiDispatcherQueue {
    pub controller: DispatcherQueueController,
}

impl WinUiDispatcherQueue {
    pub fn new_on_current_thread() -> windows::core::Result<Self> {
        let options = DispatcherQueueOptions {
            dwSize: std::mem::size_of::<DispatcherQueueOptions>() as u32,
            threadType: DQTYPE_THREAD_CURRENT,
            apartmentType: DQTAT_COM_NONE,
        };
        // SAFETY: `options` is a fully initialised DispatcherQueueOptions of the declared size.
        let controller = unsafe { CreateDispatcherQueueController(options) }?;
        Ok(Self { controller })
    }

    pub fn new_dedicated_thread() -> windows::core::Result<Self> {
        let controller = DispatcherQueueController::CreateOnDedicatedThread()?;
        info!("WinUI DispatcherQueueController created on a dedicated thread");
        Ok(Self { controller })
    }
}
