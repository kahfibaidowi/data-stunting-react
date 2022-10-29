import { Modal } from "react-bootstrap"
import classNames from "classnames"

export const ConfirmDelete=({show, toggle, title, sub_title, deleteAction})=>{
    return (
        <Modal show={show} backdrop="static" onHide={toggle} className="modal-alert" dialogClassName="modal-smd" backdropClassName="backdrop-nested">
            <Modal.Body className="p-4 text-center">
                <h5 class="mb-2 fw-bold">{title}</h5>
                <p class="mb-0" style={{lineHeight:"22px"}}>{sub_title}</p>
            </Modal.Body>
            <Modal.Footer className="mt-2 flex-nowrap p-0">
                <button 
                    type="button" 
                    class="btn btn-lg btn-link fs-6 text-decoration-none col-6 m-0 rounded-0 border-end" 
                    onClick={toggle}
                >
                    Batal
                </button>
                <button 
                    type="button" 
                    class="btn btn-lg btn-link link-danger fs-6 text-decoration-none col-6 m-0 rounded-0" 
                    onClick={deleteAction}
                >
                    <strong>Ya, Hapus Data</strong>
                </button>
            </Modal.Footer>
        </Modal>
    )
}

export const Confirm=({show, toggle, title, sub_title, action, action_text="", btn_type="btn-danger"})=>{
    return (
        <Modal show={show} backdrop="static" onHide={toggle} dialogClassName="modal-smd">
            <Modal.Body className="pb-0">
                <h4 class="fs-5 fw-bold">{title}</h4>
                <p className="mb-0">{sub_title}</p>
            </Modal.Body>
            <Modal.Footer className="mt-2">
                <button type="button" class="btn btn-link link-dark me-auto" onClick={toggle}>Cancel</button>
                <button type="button" class={classNames("btn", btn_type)} onClick={action}>{action_text}</button>
            </Modal.Footer>
        </Modal>
    )
}